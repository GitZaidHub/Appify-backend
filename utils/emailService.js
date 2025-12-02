// /mnt/data/emailService.js
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.EMAIL_USER || 'no-reply@example.com';

// Setup SendGrid if key exists
let sendGridEnabled = false;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  sendGridEnabled = true;
}

// Setup Nodemailer fallback transporter if SMTP envs exist
let smtpTransporter = null;
if (!sendGridEnabled && process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = port === 465; // true for 465, false for other ports
  smtpTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Optional: tls: { rejectUnauthorized: false } // only if you know you need it
  });
}

/**
 * Build verification URL
 * @param {string} token
 */
function buildVerificationUrl(token) {
  // We expect backend route: GET /api/users/verify-email?token=...
  // BASE_URL is expected to include /api (as in your env)
  return `${process.env.BASE_URL.replace(/\/$/, '')}/users/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Compose HTML email
 */
function verificationEmailHtml(name, verificationUrl) {
  return `
    <div style="font-family: Arial, sans-serif; line-height:1.4; color: #111;">
      <h2>Hello ${name || 'there'},</h2>
      <p>Thanks for registering. Click the button below to verify your email address:</p>
      <p style="margin: 20px 0;">
        <a href="${verificationUrl}" style="background-color:#2563eb;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">
          Verify Email
        </a>
      </p>
      <p>If the button doesn't work, paste this link in your browser:</p>
      <p style="word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
      <hr />
      <small>If you didn't create an account with ${FRONTEND_URL}, you can ignore this email.</small>
    </div>
  `;
}

/**
 * Send verification email (prefers SendGrid; falls back to SMTP transporter)
 * @param {string} to
 * @param {string} token
 * @param {string} name
 */
async function sendVerificationEmail(to, token, name = '') {
  const verificationUrl = buildVerificationUrl(token);
  const subject = 'Verify your account';
  const html = verificationEmailHtml(name, verificationUrl);
  const text = `Hello ${name || ''},\n\nVerify your account: ${verificationUrl}\n\nIf you didn't request this, ignore this email.`;

  // Prefer SendGrid HTTP API
  if (sendGridEnabled) {
    const msg = {
      to,
      from: SENDER_EMAIL,
      subject,
      text,
      html,
    };
    try {
      await sgMail.send(msg);
      console.log(`SendGrid: verification email sent to ${to}`);
      return true;
    } catch (err) {
      console.error('SendGrid send error:', err && err.message ? err.message : err);
      // don't throw yet — try SMTP fallback if available
    }
  }

  // Fallback to SMTP transporter if configured
  if (smtpTransporter) {
    const mailOptions = {
      from: SENDER_EMAIL,
      to,
      subject,
      text,
      html,
    };
    try {
      await smtpTransporter.sendMail(mailOptions);
      console.log(`SMTP: verification email sent to ${to}`);
      return true;
    } catch (err) {
      console.error('SMTP send error:', err && err.message ? err.message : err);
      throw new Error('Failed to send verification email by both SendGrid and SMTP.');
    }
  }

  // If no method available, throw to let caller decide
  throw new Error('No email provider configured (SendGrid or SMTP).');
}

module.exports = {
  sendVerificationEmail,
};

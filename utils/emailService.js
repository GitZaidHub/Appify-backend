const nodemailer = require("nodemailer");


const sendVerificationEmail = async (email, token, name = '') => {
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const url = `${process.env.BASE_URL}/users/verify-email?token=${token}`;
  const displayName = name || email.split('@')[0];

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#333;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:20px 0; background:#f5f7fb;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:24px; text-align:left;">
                <h2 style="margin:0 0 8px 0; font-size:20px; color:#111;">Welcome to Appify</h2>
                <p style="margin:0 0 16px 0; color:#555;">Hi ${displayName},</p>
                <p style="margin:0 0 20px 0; color:#555; line-height:1.5;">Thanks for creating an account. Please confirm your email address by clicking the button below. This helps us keep your account secure.</p>

                <p style="text-align:center; margin:24px 0;">
                  <a href="${url}" style="background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:6px; display:inline-block;">Verify Email</a>
                </p>

                <p style="margin:0 0 12px 0; color:#666; font-size:13px;">If the button doesn't work, copy and paste the following link into your browser:</p>
                <p style="word-break:break-all; color:#2563eb; font-size:13px; margin:0 0 12px 0;">${url}</p>

                <p style="color:#666; font-size:13px;">If you didn't create an account with us, you can safely ignore this email.</p>

                <div style="margin-top:24px; color:#888; font-size:12px;">
                  <div>Best regards,</div>
                  <div style="margin-top:4px;">The Appify Team</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#f5f7fb; padding:12px 24px; font-size:12px; color:#999; text-align:center;">
                © ${new Date().getFullYear()} Appify. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  const text = `Hello ${displayName},\n\nThanks for creating an account. Please verify your email by visiting the following link:\n\n${url}\n\nIf you didn't create an account, ignore this message.\n\n— The Appify Team`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Confirm your Appify email address",
    text,
    html,
  };

  try {
    await transporter.verify();
  } catch (err) {
    console.error("Email transporter verification failed:", err && err.message ? err.message : err);
    if (err && err.code === 'EAUTH') {
      console.error(
        "SMTP authentication failed (EAUTH). If you're using Gmail: enable 2-Step Verification and create an App Password, then set it as EMAIL_PASSWORD in your .env (no spaces).\nSee: https://support.google.com/accounts/answer/185833"
      );
    }
    throw err;
  }

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send verification email:", err && err.message ? err.message : err);
    throw err;
  }
};

module.exports = { sendVerificationEmail };

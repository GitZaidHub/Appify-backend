const nodemailer = require("nodemailer");


const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_PASSWORD, // your email password
    },
  });

  const url = `${process.env.BASE_URL}/users/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification",
    text: `Click on this link to verify your email: ${url}`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };

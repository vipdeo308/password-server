// emailService.js
const nodemailer = require('nodemailer');

const sendResetEmail = async (email, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-password'
    }
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Password Reset',
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Reset password email sent');
  } catch (error) {
    console.error('Error sending reset password email', error);
  }
};

module.exports = { sendResetEmail };

require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    console.log("Attempting to send email to:", to);

    const info = await transporter.sendMail({
      from: `"BANK BACKEND" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, userName) {
  console.log("=== EMAIL FUNCTION CALLED ===");
  console.log("Email:", userEmail);
  console.log("Name:", userName);

  const subject = 'Welcome to BANK BACKEND!';
  const text = `Hello ${userName},\n\nThank you for registering with BANK BACKEND. We're excited to have you on board!\n\nBest regards,\nBANK BACKEND Team`;
  const html = `<p>Hello ${userName},</p><p>Thank you for registering with <strong>BANK BACKEND</strong>. We're excited to have you on board!</p><p>Best regards,<br>BANK BACKEND Team</p>`;
  await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendEmail, sendRegistrationEmail };
//module.exports = transporter;
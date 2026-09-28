const nodemailer = require('nodemailer');

function logOAuthHelp() {
    console.error('Gmail authentication is invalid or expired.');
    console.error('Fix options:');
    console.error('  1. Regenerate the OAuth refresh token: npm run generate:gmail-token');
    console.error('  2. Or create a Gmail app password and set EMAIL_APP_PASSWORD in .env');
    console.error('     (Google Account > Security > 2-Step Verification > App passwords)');
}

function createTransporter() {
    const user = process.env.EMAIL_USER?.trim();

    if (!user) {
        console.warn('EMAIL_USER is not set — email sending is disabled.');
        return null;
    }

    if (process.env.EMAIL_APP_PASSWORD) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });
    }

    const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;

    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        console.warn('Gmail OAuth credentials are incomplete — email sending is disabled.');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
        },
    });
}

let transporter = createTransporter();

if (transporter) {
    transporter.verify((error) => {
        if (error) {
            console.error('Error connecting to email server:', error.message);
            transporter = null;

            if (
                error.message.includes('invalid_grant') ||
                error.message.includes('535') ||
                error.message.includes('Connection closed unexpectedly')
            ) {
                logOAuthHelp();
            }
        } else {
            console.log('Email server is ready to send messages');
        }
    });
}

async function sendEmail(to, subject, text, html) {
    if (!transporter) {
        console.warn(`Email not sent (transporter unavailable): ${subject}`);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Backend-bank" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error.message);

        if (
            error.message.includes('invalid_grant') ||
            error.message.includes('535') ||
            error.message.includes('Connection closed unexpectedly')
        ) {
            transporter = null;
            logOAuthHelp();
        }
    }
}

async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to Backend-bank!';
    const text = `Hello ${name},\n\nThank you for registering at Backend-bank. We're excited to have you on board!\n\nBest regards,\nThe Backend-bank Team`;
    const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend-bank. We're excited to have you on board!</p><p>Best regards,<br>The Backend-bank Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful!';
    const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend-bank Team`;
    const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend-bank Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Failed';
    const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Backend-bank Team`;
    const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Backend-bank Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    createTransporter,
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
};

const nodemailer = require('nodemailer');

function logOAuthHelp() {
    console.error('Gmail OAuth refresh token is invalid or expired (invalid_grant).');
    console.error('Fix options:');
    console.error('  1. Regenerate token: npm run generate:gmail-token');
    console.error('  2. Or use an app password: set EMAIL_APP_PASSWORD in .env');
    console.error('     (Google Account > Security > 2-Step Verification > App passwords)');
}

function createTransporter() {
    const user = process.env.EMAIL_USER;

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

const transporter = createTransporter();

if (transporter) {
    transporter.verify((error) => {
        if (error) {
            console.error('Error connecting to email server:', error.message);

            if (error.message.includes('invalid_grant')) {
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

        if (error.message.includes('invalid_grant')) {
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
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
};

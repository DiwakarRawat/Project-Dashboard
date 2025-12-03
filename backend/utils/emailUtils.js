
const nodemailer = require('nodemailer');

// 1. Create a Transporter using your credentials from .env
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        // Required option for Nodemailer to connect when facing self-signed or non-standard certs
        rejectUnauthorized: false
    }
});

// 2. Function to send the email
const sendNotificationEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: htmlContent, // We use HTML for formatted emails
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

module.exports = {
    sendNotificationEmail,
};
'use strict';

const nodemailer = require('nodemailer');

let _transporter = null;

/**
 * Creates the transport based on environment variables.
 * Prioritizes Ethereal for testing or Gmail for production.
 */
async function getTransporter() {
  if (_transporter) return _transporter;

  // Use Ethereal if MAIL_DRIVER is explicitly set
  if (process.env.MAIL_DRIVER === 'ethereal') {
    console.log('[mailer] 🧪 Using Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return _transporter;
  }

  // Fallback to Standard SMTP (e.g., Gmail)
  console.log(`[mailer] 📧 Using SMTP Provider: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // Port 587 is usually TLS (secure: false)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Google App Password
    },
  });

  return _transporter;
}

/**
 * Send an HTML email.
 * @param {string} to       Recipient email address
 * @param {string} subject
 * @param {string} html     Rendered HTML body
 */
exports.sendEmail = async function sendEmail(to, subject, html) {
  if (!to) {
    console.warn('[mailer] Skipping email: No recipient address provided.');
    return;
  }

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from:    process.env.MAIL_FROM || 'noreply@mediconnect.io',
      to,
      subject,
      html,
    });

    console.log(`[mailer] ✅ Success: Email sent to ${to} (${info.messageId})`);

    // Log Ethereal URL if we're using a test account
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`[mailer] 🔗 Preview Link: ${testUrl}`);
    }
  } catch (err) {
    console.error(`[mailer] ❌ FATAL Error sending to ${to}:`, err.message);
    
    // If SMTP fails (e.g. bad Gmail creds), don't crash the whole consumer.
    // Just log it and move on.
  }
};

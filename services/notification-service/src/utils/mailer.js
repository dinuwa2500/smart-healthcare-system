'use strict';

const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.sendgrid.net',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  return _transporter;
}

/**
 * Send an HTML email.
 * @param {string} to       recipient email address
 * @param {string} subject
 * @param {string} html     rendered HTML body
 */
exports.sendEmail = async function sendEmail(to, subject, html) {
  if (!to) {
    console.warn('[mailer] No recipient address – skipping email');
    return;
  }

  try {
    const info = await getTransporter().sendMail({
      from:    process.env.SENDGRID_FROM || 'noreply@mediconnect.io',
      to,
      subject,
      html,
    });
    console.log(`[mailer] Email sent to ${to} (${info.messageId})`);
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${to}:`, err.message);
    throw err;
  }
};

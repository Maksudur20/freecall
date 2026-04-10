/**
 * Email Configuration and Service
 * Supports SendGrid (primary) and SMTP fallback (nodemailer)
 */

import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

let emailService = null;
let emailProvider = 'none';

/**
 * Initialize email service
 * Tries SendGrid first, falls back to SMTP if not configured
 */
export const initEmailService = async () => {
  try {
    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      // Test SendGrid connection
      try {
        await sgMail.send({
          to: 'test@example.com',
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@freecall.app',
          subject: 'Test',
          text: 'Test',
        });
      } catch (error) {
        // Expected to fail for test email, this just validates API key works
        if (!error.message.includes('Invalid email')) {
          throw error;
        }
      }
      
      emailProvider = 'sendgrid';
      console.log('✅ SendGrid email service initialized');
      return sgMail;
    }

    // Fallback to SMTP (nodemailer)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      emailService = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Test SMTP connection
      await emailService.verify();
      emailProvider = 'smtp';
      console.log('✅ SMTP email service initialized');
      return emailService;
    }

    console.warn('⚠️  No email service configured. Emails will be logged only.');
    emailProvider = 'none';
    return null;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
    console.warn('⚠️  Emails will be logged to console only');
    emailProvider = 'none';
    return null;
  }
};

/**
 * Get email service status
 */
export const getEmailService = () => {
  return emailService;
};

/**
 * Check if email service is available
 */
export const isEmailServiceAvailable = () => {
  return emailProvider !== 'none';
};

/**
 * Get email provider type
 */
export const getEmailProvider = () => {
  return emailProvider;
};

/**
 * Send email using configured provider
 * @param {Object} emailData - Email data { to, subject, html, text }
 */
export const sendEmail = async (emailData) => {
  const {
    to,
    subject,
    html,
    text,
    from = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@freecall.app',
  } = emailData;

  try {
    // Validate email data
    if (!to || !subject) {
      throw new Error('Missing required email fields: to, subject');
    }

    // Send using SendGrid
    if (emailProvider === 'sendgrid') {
      const message = {
        to,
        from,
        subject,
        html: html || text,
        text: text || 'Please view this email in HTML mode.',
      };

      await sgMail.send(message);
      console.log(`✅ Email sent via SendGrid to ${to}`);
      return { success: true, provider: 'sendgrid' };
    }

    // Send using SMTP
    if (emailProvider === 'smtp' && emailService) {
      const mailOptions = {
        from,
        to,
        subject,
        html: html || text,
        text: text,
      };

      await emailService.sendMail(mailOptions);
      console.log(`✅ Email sent via SMTP to ${to}`);
      return { success: true, provider: 'smtp' };
    }

    // Fallback: Log to console if no provider configured
    console.log(`📧 [EMAIL LOG] To: ${to}`);
    console.log(`📧 [EMAIL LOG] Subject: ${subject}`);
    console.log(`📧 [EMAIL LOG] Body:\n${html || text}`);
    return { success: false, provider: 'none', message: 'Email logged to console' };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

export default {
  initEmailService,
  getEmailService,
  isEmailServiceAvailable,
  getEmailProvider,
  sendEmail,
};

/**
 * Email Templates Service
 * Generates clean, professional HTML emails
 */

/**
 * Base email template (wrapper)
 */
const baseTemplate = (content) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      padding: 0;
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-body h2 {
      font-size: 20px;
      margin-bottom: 15px;
      color: #333;
    }
    .email-body p {
      margin-bottom: 15px;
      font-size: 15px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
      font-size: 15px;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .otp-code {
      background-color: #f5f5f5;
      border: 2px solid #667eea;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #667eea;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
    }
    .info-box {
      background-color: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .email-footer {
      background-color: #f5f5f5;
      padding: 20px 30px;
      text-align: center;
      font-size: 13px;
      color: #999;
      border-top: 1px solid #ddd;
    }
    .email-footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #ddd;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
  </div>
</body>
</html>
  `;
};

/**
 * Email verification template
 */
export const verificationEmailTemplate = (userName, verificationLink, verificationCode) => {
  const content = `
    <div class="email-header">
      <h1>🎉 Welcome to FreeCall!</h1>
    </div>
    
    <div class="email-body">
      <h2>Verify Your Email Address</h2>
      <p>Hi ${userName},</p>
      <p>Thanks for joining FreeCall! To get started, please verify your email address by clicking the button below:</p>
      
      <center>
        <a href="${verificationLink}" class="cta-button" style="display: inline-block;">
          Verify Email Address
        </a>
      </center>
      
      <p style="text-align: center; color: #999; font-size: 13px; margin-top: 15px;">
        Or copy this verification code:
      </p>
      
      <div class="otp-code">${verificationCode}</div>
      
      <div class="info-box">
        <strong>⏰ Note:</strong> This link expires in 24 hours for security reasons.
      </div>
      
      <p style="color: #999; font-size: 13px;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
    
    <div class="email-footer">
      <p>© 2024 FreeCall. All rights reserved.</p>
      <p>
        <a href="https://freecall.app/settings">Privacy Policy</a> • 
        <a href="https://freecall.app/terms">Terms of Service</a>
      </p>
    </div>
  `;
  
  return baseTemplate(content);
};

/**
 * Password reset email template
 */
export const passwordResetEmailTemplate = (userName, resetLink, resetCode, expiryMinutes = 60) => {
  const content = `
    <div class="email-header">
      <h1>🔒 Reset Your Password</h1>
    </div>
    
    <div class="email-body">
      <h2>Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      
      <center>
        <a href="${resetLink}" class="cta-button" style="display: inline-block;">
          Reset Password
        </a>
      </center>
      
      <p style="text-align: center; color: #999; font-size: 13px; margin-top: 15px;">
        Or use this reset code:
      </p>
      
      <div class="otp-code">${resetCode}</div>
      
      <div class="info-box">
        <strong>⏰ Important:</strong> This link expires in ${expiryMinutes} minutes for security.
      </div>
      
      <div class="info-box" style="border-color: #f59e0b; background-color: #fffbeb;">
        <strong>🔐 Security Tip:</strong> If you didn't request this, ignore this email and your password will remain unchanged.
      </div>
    </div>
    
    <div class="email-footer">
      <p>© 2024 FreeCall. All rights reserved.</p>
      <p>
        <a href="https://freecall.app/settings">Privacy Policy</a> • 
        <a href="https://freecall.app/support">Support</a>
      </p>
    </div>
  `;
  
  return baseTemplate(content);
};

/**
 * Welcome email template
 */
export const welcomeEmailTemplate = (userName) => {
  const content = `
    <div class="email-header">
      <h1>🎊 Welcome aboard!</h1>
    </div>
    
    <div class="email-body">
      <h2>Your account is ready</h2>
      <p>Hi ${userName},</p>
      <p>Your FreeCall account is now active and ready to use! You can start connecting with friends and family right away.</p>
      
      <h3 style="margin-top: 25px; margin-bottom: 15px;">Getting Started:</h3>
      <ul style="margin-left: 20px; color: #555;">
        <li style="margin-bottom: 10px;">Complete your profile with a photo and bio</li>
        <li style="margin-bottom: 10px;">Find and add friends to connect</li>
        <li style="margin-bottom: 10px;">Start messaging and calling</li>
        <li style="margin-bottom: 10px;">Share files and media easily</li>
      </ul>
      
      <center>
        <a href="https://freecall.app/dashboard" class="cta-button" style="display: inline-block;">
          Go to Dashboard
        </a>
      </center>
      
      <div class="info-box">
        <strong>💡 Tip:</strong> Check out our <a href="https://freecall.app/help" style="color: #667eea;">Help Center</a> for guides and tutorials.
      </div>
    </div>
    
    <div class="email-footer">
      <p>© 2024 FreeCall. All rights reserved.</p>
      <p>
        <a href="https://freecall.app/settings">Privacy Policy</a> • 
        <a href="https://freecall.app/terms">Terms of Service</a>
      </p>
    </div>
  `;
  
  return baseTemplate(content);
};

/**
 * Password changed notification template
 */
export const passwordChangedEmailTemplate = (userName) => {
  const content = `
    <div class="email-header">
      <h1>🔐 Password Updated</h1>
    </div>
    
    <div class="email-body">
      <h2>Your password has been changed</h2>
      <p>Hi ${userName},</p>
      <p>We're confirming that your FreeCall password was recently changed.</p>
      
      <div class="info-box" style="border-color: #10b981; background-color: #f0fdf4;">
        <strong>✓ Your account is secure</strong> if you made this change.
      </div>
      
      <div class="info-box" style="border-color: #ef4444; background-color: #fef2f2;">
        <strong>⚠ Suspicious activity?</strong> If you didn't change your password, <a href="https://freecall.app/support" style="color: #ef4444;">contact support</a> immediately.
      </div>
    </div>
    
    <div class="email-footer">
      <p>© 2024 FreeCall. All rights reserved.</p>
      <p>
        <a href="https://freecall.app/settings">Security Settings</a> • 
        <a href="https://freecall.app/support">Support</a>
      </p>
    </div>
  `;
  
  return baseTemplate(content);
};

/**
 * Email verification reminder template
 */
export const verificationReminderEmailTemplate = (userName, verificationLink) => {
  const content = `
    <div class="email-header">
      <h1>📧 Verify Your Email</h1>
    </div>
    
    <div class="email-body">
      <h2>Don't miss out!</h2>
      <p>Hi ${userName},</p>
      <p>You created a FreeCall account but haven't verified your email yet. Verify now to unlock all features:</p>
      
      <ul style="margin: 20px 0 20px 20px; color: #555;">
        <li style="margin-bottom: 10px;">Access full messaging capabilities</li>
        <li style="margin-bottom: 10px;">Enable file sharing</li>
        <li style="margin-bottom: 10px;">Receive notifications</li>
        <li style="margin-bottom: 10px;">Complete account security</li>
      </ul>
      
      <center>
        <a href="${verificationLink}" class="cta-button" style="display: inline-block;">
          Verify Email Now
        </a>
      </center>
      
      <div class="info-box">
        <strong>⏰ Hurry:</strong> Verification links expire for security reasons.
      </div>
    </div>
    
    <div class="email-footer">
      <p>© 2024 FreeCall. All rights reserved.</p>
      <p>
        <a href="https://freecall.app/settings">Settings</a> • 
        <a href="https://freecall.app/support">Support</a>
      </p>
    </div>
  `;
  
  return baseTemplate(content);
};

export default {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  passwordChangedEmailTemplate,
  verificationReminderEmailTemplate,
};

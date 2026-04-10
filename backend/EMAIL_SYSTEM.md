# Email System Documentation

## Overview

FreeCall's email system provides secure email verification for user registration and password reset functionality. The system supports both SendGrid (cloud-based) and SMTP (self-hosted) providers with intelligent fallback to console logging during development.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Auth Controller                       │
│  (register, login, verify-email, reset-password)        │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────────┐
│   Token     │  │  Email Config   │
│  Service    │  │  & Sending      │
└──────┬──────┘  └────────┬────────┘
       │                  │
       │         ┌────────┴──────────┐
       │         │                   │
┌──────▼────┐ ┌──▼──────┐ ┌────────▼──┐
│  Redis    │ │SendGrid │ │   SMTP    │
│ (Primary) │ │ (Cloud) │ │(Self-Host)│
└───────────┘ └────┬────┘ └─────┬─────┘
                   │            │
                   └─────┬───────┘
                         │
                 ┌───────▼────────┐
                 │  Email Sent    │
                 │  to User       │
                 └────────────────┘
```

## Features

### 1. Email Verification on Signup
- New users must verify their email before accessing the application
- Two verification methods:
  - **Token Link**: Click link with embedded token (24-hour expiration)
  - **OTP Code**: Enter 6-digit code via verification form (24-hour expiration)
- Automatic welcome email sent after verification
- Re-send verification email if original expires

### 2. Password Reset
- Secure password reset with email verification
- Two reset methods:
  - **Reset Link**: Click link with embedded token (1-hour expiration)
  - **OTP Code**: Enter 6-digit code via reset form (1-hour expiration)
- Both methods require new password confirmation

### 3. Security Features
- **Token Hashing**: Tokens are SHA-256 hashed, never stored plain-text
- **OTP Generation**: 6-digit random codes (100000-999999)
- **Timing-Safe Comparison**: Prevents timing attacks on token/OTP verification
- **Token Expiration**: Automatic cleanup of expired tokens in Redis
- **Rate Limiting**: Login and email requests limited to prevent abuse
- **Environment Separation**: Different links for development vs. production

### 4. Flexible Email Provider
- **Primary**: SendGrid (cloud-based, reliable, production-ready)
- **Fallback**: SMTP (custom SMTP, self-hosted options, Gmail, Office 365)
- **Development**: Console logging of email content (no sending required)

## Setup Guide

### Option 1: SendGrid (Recommended for Production)

#### 1. Create SendGrid Account
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Complete email verification

#### 2. Generate API Key
1. Navigate to Settings > API Keys
2. Click "Create API Key"
3. Give it a name like "FreeCall-Production"
4. Select "Restricted Access"
5. Enable permissions:
   - ✓ Mail Send
   - ✓ Mail Settings > Sender Authentication
6. Copy the API key

#### 3. Configure .env
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_actual_api_key_here
```

#### 4. Verify Sender Email
In SendGrid dashboard:
1. Go to Settings > Sender Authentication
2. Add your "From" email address
3. Verify domain or single sender (depending on plan)

### Option 2: SMTP (Gmail, Office 365, Custom)

#### For Gmail
1. Enable 2-factor authentication on Google account
2. Generate App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Configure .env:
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_SECURE=true
SMTP_FROM_EMAIL=your-email@gmail.com
```

#### For Office 365
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your_password
SMTP_SECURE=true
SMTP_FROM_EMAIL=your-email@outlook.com
```

#### For Custom SMTP
Contact your email provider for:
- SMTP Host
- SMTP Port (usually 587 or 465)
- Username
- Password
- From Email

Then configure .env accordingly.

### Option 3: Development (No Real Email)

For local development without email setup:
```bash
# Leave EMAIL_PROVIDER empty or unset
FRONTEND_URL=http://localhost:3000
```

Emails will print to server console:
```
[Email Service] Verification email to: user@example.com
  Subject: Verify Your Email - FreeCall
  HTML: <full email HTML>
```

Copy the verification/reset links from the console and use manually in browser.

## API Endpoints

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

Response:
```json
{
  "message": "User registered successfully. Verification email sent.",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "emailVerified": false
  },
  "verificationRequired": true
}
```

#### 2. Verify Email with Token
```http
POST /api/auth/verify-email-token
Content-Type: application/json

{
  "userId": "user_id",
  "token": "verification_token_from_email_link"
}
```

Response:
```json
{
  "message": "Email verified successfully! You can now log in.",
  "emailVerified": true,
  "user": { ... }
}
```

#### 3. Verify Email with OTP
```http
POST /api/auth/verify-email-otp
Content-Type: application/json

{
  "userId": "user_id",
  "otp": "123456"
}
```

Response:
```json
{
  "message": "Email verified successfully! You can now log in.",
  "emailVerified": true,
  "user": { ... }
}
```

#### 4. Resend Verification Email
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

Response:
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

#### 5. Request Password Reset
```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "john@example.com"
}
```

Response:
```json
{
  "message": "Password reset instructions have been sent to your email."
}
```

#### 6. Reset Password with Token
```http
POST /api/auth/reset-password-token
Content-Type: application/json

{
  "userId": "user_id",
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePassword456"
}
```

Response:
```json
{
  "message": "Password reset successfully. You can now log in with your new password."
}
```

#### 7. Reset Password with OTP
```http
POST /api/auth/reset-password-otp
Content-Type: application/json

{
  "userId": "user_id",
  "otp": "654321",
  "newPassword": "NewSecurePassword456"
}
```

Response:
```json
{
  "message": "Password reset successfully. You can now log in with your new password."
}
```

#### 8. Login (Now requires verification)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

Response (if verified):
```json
{
  "message": "Logged in successfully",
  "user": { ... },
  "accessToken": "eyJhbGc..."
}
```

Response (if not verified):
```json
{
  "error": "Email not verified. Please verify your email before logging in.",
  "emailVerified": false,
  "email": "john@example.com"
}
```

## Email Templates

### 1. Verification Email
- Sent when: User registers
- Contains: Verification link, OTP code, expiration info
- Design: Professional with FreeCall branding

### 2. Password Reset Email
- Sent when: User requests password reset
- Contains: Reset link, OTP code, expiration info (1 hour)
- Design: Security-focused messaging

### 3. Welcome Email
- Sent when: Email verification completes
- Contains: Welcome message, login link
- Design: Friendly onboarding message

### 4. Password Changed Email
- Sent when: Password reset completes
- Contains: Confirmation, security tips
- Design: Confirmation and reassurance

### 5. Verification Reminder Email
- Sent when: User requests verification resend
- Contains: Verification link, OTP, 24-hour expiration
- Design: Light reminder without pressure

## Token Management

### Token Service (`backend/src/services/token.js`)

#### Methods

##### Generate Tokens
```javascript
// Generate email verification token
const { token, otp, expiresAt } = TokenService.generateEmailVerificationToken(userId);
// token: 32-byte hex string, otp: 6-digit code, expiresAt: 24 hours

// Generate password reset token
const { token, otp, expiresAt } = TokenService.generatePasswordResetToken(userId);
// token: 32-byte hex string, otp: 6-digit code, expiresAt: 1 hour
```

##### Verify Tokens
```javascript
// Verify email token
const isValid = TokenService.verifyEmailVerificationToken(userId, token);

// Verify email OTP
const isValid = TokenService.verifyEmailOTP(userId, otp);

// Verify password reset token
const isValid = TokenService.verifyPasswordResetToken(userId, token);

// Verify password reset OTP
const isValid = TokenService.verifyPasswordResetOTP(userId, otp);
```

##### Token Storage
- **Redis** (Primary): Faster, automatic expiration cleanup
- **Memory** (Fallback): Works without Redis, cleared on server restart

### Expiration Times
- **Email Verification**: 24 hours
- **Password Reset**: 1 hour (security-focused, shorter window)

## Frontend Integration

### Signup Flow
```
1. User enters username, email, password
2. Click "Register"
3. POST /api/auth/register
4. Show "Verification email sent" message
5. Redirect to /verify-email page
6. User receives email with:
   - Clickable verification link (token-based)
   - 6-digit OTP code alternative
7. Either option completes verification
8. Redirect to login, email confirmed
```

### Password Reset Flow
```
1. User clicks "Forgot Password"
2. Enter email address
3. POST /api/auth/request-password-reset
4. Show "Check your email" message
5. User receives email with:
   - Clickable reset link (token-based)
   - 6-digit OTP code alternative
6. Either option leads to password reset form
7. Enter new password
8. POST /api/auth/reset-password-token or reset-password-otp
9. Show "Password changed successfully"
10. Redirect to login
```

### Frontend Links Format

**Email Verification Link:**
```
https://freecall-frontend.vercel.app/verify-email?token=<token>&userId=<userId>
```

**Password Reset Link:**
```
https://freecall-frontend.vercel.app/reset-password?token=<token>&userId=<userId>
```

Frontend should extract `token` and `userId` from URL and send via API request.

## Security Best Practices

✓ **Implemented in System**
- Tokens are SHA-256 hashed, never stored plain
- Timing-safe comparison prevents timing attacks
- Tokens auto-expire (Redis with TTL)
- OTP is 6 digits (1 in 1 million uniqueness)
- Separate expiration times (24h email, 1h password reset)
- Rate limiting on email/login endpoints
- Email endpoint doesn't reveal if user exists (security)
- Password hashing with bcryptjs (10 salt rounds)

✓ **Recommended for Frontend**
- Use HTTPS only (enforced in production)
- Store tokens in httpOnly cookies where possible
- Never log tokens to console in production
- Validate token format before submission
- Show countdown timer for token expiration
- Provide resend option if token expires

## Troubleshooting

### Emails Not Sending

#### Check Email Service Status
```bash
# In browser console or API test:
GET /api/auth/<any-endpoint>
# Should include email service info in response or logs
```

#### SendGrid Issues
- ❌ "Invalid SendGrid API Key" → Check SENDGRID_API_KEY format (`SG.xxxxx`)
- ❌ "Authentication failed" → Regenerate API key in SendGrid dashboard
- ❌ "Invalid sender email" → Verify email in SendGrid Sender Authentication

#### SMTP Issues
- ❌ "Connect ECONNREFUSED" → Check SMTP_HOST and SMTP_PORT
- ❌ "Invalid credentials" → Test with SMTP_USER and SMTP_PASSWORD separately
- ❌ "5.7.1 Unauthorized" (Gmail) → Use App Password instead of account password
- ❌ Timeout → May need SMTP_SECURE=false if on non-standard port

#### Development Mode
- Emails print to server console
- Copy verification/reset links from console logs
- Manually paste links into browser for testing

### Token Issues

#### "Invalid or expired token"
- ❌ Token has expired (24h for email, 1h for password reset)
- ✓ Request new token via resend endpoints
- ✓ Check server time is correct (NTP sync)

#### Tokens not expiring (Redis issue)
- Check REDIS_URL configuration
- Verify Redis server is running
- Tokens fallback to memory if Redis unavailable (lost on restart)

#### Redis Connection Failed
- System uses memory fallback automatically
- Tokens won't persist across server restarts
- Configure REDIS_URL for production reliability

## Monitoring & Logging

### Email Service Logging
Emails are logged with details:
```
[Email Service] Sent: verification email
  To: user@example.com
  Subject: Verify Your Email - FreeCall
  Provider: sendgrid | smtp | console
  Timestamp: 2024-01-15T10:30:45Z
```

### Token Service Logging
Token operations log for debugging:
```
[Token Service] Generated: email-verification token
  UserId: 507f1f77bcf86cd799439011
  Type: email-verification
  ExpiresAt: 2024-01-16T10:30:45Z
  Storage: redis | memory
```

### Error Logging
All errors include context:
```
[ERROR] Email Service
  Error: SENDGRID_API_KEY not configured
  Fallback: Using console logging
  Action: Configure SENDGRID_API_KEY in .env
```

## Performance Considerations

### Token Storage
- **Redis**: O(1) lookup, automatic expiration cleanup
- **Memory**: O(1) lookup, manual cleanup on expiry check

### Email Sending
- **SendGrid**: Cloud-hosted, reliable, 3-5 seconds typical
- **SMTP**: Network-dependent, 2-10 seconds typical
- **Console**: Instant (development only)

### Database Queries
- User lookup by email: Uses indexed field, O(log n)
- Token hash comparison: Timing-safe, constant time
- Token cleanup: Background task (can be improved with cron)

## Future Enhancements

Potential additions:
1. **Email verification link click tracking** - Analytics
2. **Bulk email verification cleanup** - Scheduled job
3. **Email bounce handling** - Invalid email detection
4. **2FA via email** - Additional security layer
5. **Email signature** - Comply with DKIM/SPF
6. **Email templates in database** - Dynamic customization
7. **Multi-language emails** - Internationalization
8. **Custom email provider plugins** - Mailgun, AWS SES support
9. **Email delivery tracking** - Webhook integration
10. **Unsubscribe management** - Email preference center

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── email.js                 # Email service configuration
│   ├── services/
│   │   ├── token.js                 # Token generation & verification
│   │   ├── emailTemplates.js        # HTML email templates
│   │   └── authService.js           # Auth business logic
│   ├── controllers/
│   │   └── authController.js        # Auth endpoints (updated)
│   ├── routes/
│   │   └── auth.js                  # Auth routes (updated)
│   └── models/
│       └── User.js                  # User model (updated)
├── .env.email.example               # Email configuration template
└── EMAIL_SYSTEM.md                  # This file
```

## Support & Maintenance

### Common Maintenance Tasks
- Monitor email delivery rates
- Check token expiration cleanup (Redis)
- Update email templates seasonally
- Review SendGrid/SMTP logs monthly
- Test email functionality after updates

### Debug Checklist
- [ ] EMAIL_PROVIDER set correctly
- [ ] API keys/credentials valid
- [ ] FRONTEND_URL correct for environment
- [ ] REDIS_URL configured (optional but recommended)
- [ ] Email templates rendering correctly
- [ ] Rate limiting not blocking legitimate requests
- [ ] Token expiration times appropriate

## Questions?

For issues or questions about the email system:
1. Check server logs for detailed error messages
2. Test email provider credentials separately
3. Verify FRONTEND_URL points to correct domain
4. Check Redis connection if using token storage
5. Review this documentation for your specific setup

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Status**: Production Ready

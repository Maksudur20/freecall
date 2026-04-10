// Authentication Controller
import { body } from 'express-validator';
import AuthService from '../services/authService.js';
import User from '../models/User.js';
import { initEmailService, sendEmail, isEmailServiceAvailable } from '../config/email.js';
import TokenService from '../services/token.js';
import { verificationEmailTemplate, passwordResetEmailTemplate, welcomeEmailTemplate } from '../services/emailTemplates.js';

// Initialize email service on startup
initEmailService();

export const authController = {
  // Register - sends verification email instead of auto-login
  register: [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    async (req, res, next) => {
      try {
        const { username, email, password } = req.body;
        
        // Register user (not verified yet)
        const user = await AuthService.registerUser({ username, email, password });
        
        // Generate verification tokens
        const { token, otp, expiresAt } = TokenService.generateEmailVerificationToken(user._id);
        
        // Save token hash to user
        user.verificationTokenHash = token; // The token service returns the hash
        await user.save();
        
        // Generate verification link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${token}&userId=${user._id}`;
        
        // Send verification email
        try {
          if (isEmailServiceAvailable()) {
            const emailHtml = verificationEmailTemplate(user.username, verificationLink, otp);
            await sendEmail({
              to: user.email,
              subject: 'Verify Your Email - FreeCall',
              html: emailHtml,
            });
          }
        } catch (emailError) {
          console.warn('Email send failed, but registration completed:', emailError.message);
        }

        res.status(201).json({
          message: 'User registered successfully. Verification email sent. Please check your inbox.',
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            emailVerified: user.emailVerified,
          },
          verificationRequired: true,
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Login - now checks email verification
  login: [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    async (req, res, next) => {
      try {
        const { email, password } = req.body;
        
        const result = await AuthService.loginUser(email, password);

        // Check if email is verified
        if (!result.user.emailVerified) {
          return res.status(403).json({
            error: 'Email not verified. Please verify your email before logging in.',
            emailVerified: false,
            email: result.user.email,
          });
        }

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({
          message: 'Logged in successfully',
          user: result.user,
          accessToken: result.accessToken,
        });
      } catch (error) {
        res.status(401).json({ error: error.message });
      }
    },
  ],

  // Refresh Token
  refreshToken: async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token' });
      }

      const decoded = AuthService.verifyToken(refreshToken, true);
      const result = await AuthService.refreshAccessToken(decoded.id);

      res.json({
        message: 'Token refreshed',
        accessToken: result.accessToken,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  // Logout
  logout: (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  },

  // Get current user
  getCurrentUser: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user: user.toJSON() });
    } catch (error) {
      next(error);
    }
  },

  // Verify Email with Token
  verifyEmailToken: [
    body('token').notEmpty().withMessage('Verification token required'),
    body('userId').notEmpty().withMessage('User ID required'),
    async (req, res, next) => {
      try {
        const { token, userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        if (user.emailVerified) {
          return res.status(400).json({ error: 'Email already verified' });
        }

        // Verify token
        const isValid = TokenService.verifyEmailVerificationToken(userId, token);
        if (!isValid) {
          return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        // Mark email as verified
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.verificationTokenHash = null;
        await user.save();

        // Send welcome email
        try {
          if (isEmailServiceAvailable()) {
            const emailHtml = welcomeEmailTemplate(user.username);
            await sendEmail({
              to: user.email,
              subject: 'Welcome to FreeCall!',
              html: emailHtml,
            });
          }
        } catch (emailError) {
          console.warn('Welcome email send failed:', emailError.message);
        }

        res.json({
          message: 'Email verified successfully! You can now log in.',
          emailVerified: true,
          user: user.toJSON(),
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Verify Email with OTP
  verifyEmailOTP: [
    body('userId').notEmpty().withMessage('User ID required'),
    body('otp').matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
    async (req, res, next) => {
      try {
        const { userId, otp } = req.body;
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        if (user.emailVerified) {
          return res.status(400).json({ error: 'Email already verified' });
        }

        // Verify OTP
        const isValid = TokenService.verifyEmailOTP(userId, otp);
        if (!isValid) {
          return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Mark email as verified
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.verificationTokenHash = null;
        await user.save();

        // Send welcome email
        try {
          if (isEmailServiceAvailable()) {
            const emailHtml = welcomeEmailTemplate(user.username);
            await sendEmail({
              to: user.email,
              subject: 'Welcome to FreeCall!',
              html: emailHtml,
            });
          }
        } catch (emailError) {
          console.warn('Welcome email send failed:', emailError.message);
        }

        res.json({
          message: 'Email verified successfully! You can now log in.',
          emailVerified: true,
          user: user.toJSON(),
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Resend Verification Email
  resendVerificationEmail: [
    body('email').isEmail().withMessage('Valid email required'),
    async (req, res, next) => {
      try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          // Don't reveal if email exists (security)
          return res.status(200).json({
            message: 'If the email exists and is not verified, a verification email has been sent.',
          });
        }

        if (user.emailVerified) {
          return res.status(400).json({ error: 'Email is already verified' });
        }

        // Generate new verification tokens
        const { token, otp, expiresAt } = TokenService.generateEmailVerificationToken(user._id);
        user.verificationTokenHash = token;
        await user.save();

        // Send verification email
        try {
          if (isEmailServiceAvailable()) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const verificationLink = `${frontendUrl}/verify-email?token=${token}&userId=${user._id}`;
            const emailHtml = verificationEmailTemplate(user.username, verificationLink, otp);
            await sendEmail({
              to: user.email,
              subject: 'Verify Your Email - FreeCall',
              html: emailHtml,
            });
          }
        } catch (emailError) {
          console.warn('Email send failed:', emailError.message);
        }

        res.json({
          message: 'Verification email sent. Please check your inbox.',
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Request Password Reset
  requestPasswordReset: [
    body('email').isEmail().withMessage('Valid email required'),
    async (req, res, next) => {
      try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          // Don't reveal if email exists (security)
          return res.status(200).json({
            message: 'If an account exists with this email, a password reset link has been sent.',
          });
        }

        // Generate password reset tokens
        const { token, otp, expiresAt } = TokenService.generatePasswordResetToken(user._id);
        user.passwordResetTokenHash = token;
        await user.save();

        // Send password reset email
        try {
          if (isEmailServiceAvailable()) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetLink = `${frontendUrl}/reset-password?token=${token}&userId=${user._id}`;
            const emailHtml = passwordResetEmailTemplate(user.username, resetLink, otp);
            await sendEmail({
              to: user.email,
              subject: 'Reset Your Password - FreeCall',
              html: emailHtml,
            });
          }
        } catch (emailError) {
          console.warn('Email send failed:', emailError.message);
        }

        res.json({
          message: 'Password reset instructions have been sent to your email.',
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Reset Password with Token
  resetPasswordToken: [
    body('userId').notEmpty().withMessage('User ID required'),
    body('token').notEmpty().withMessage('Reset token required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    async (req, res, next) => {
      try {
        const { userId, token, newPassword } = req.body;
        const user = await User.findById(userId).select('+password');

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Verify token
        const isValid = TokenService.verifyPasswordResetToken(userId, token);
        if (!isValid) {
          return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetTokenHash = null;
        await user.save();

        res.json({
          message: 'Password reset successfully. You can now log in with your new password.',
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Reset Password with OTP
  resetPasswordOTP: [
    body('userId').notEmpty().withMessage('User ID required'),
    body('otp').matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    async (req, res, next) => {
      try {
        const { userId, otp, newPassword } = req.body;
        const user = await User.findById(userId).select('+password');

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Verify OTP
        const isValid = TokenService.verifyPasswordResetOTP(userId, otp);
        if (!isValid) {
          return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetTokenHash = null;
        await user.save();

        res.json({
          message: 'Password reset successfully. You can now log in with your new password.',
        });
      } catch (error) {
        next(error);
      }
    },
  ],
};

export default authController;

// Authentication routes
import express from 'express';
import authController from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { validateRegister, validateLogin } from '../middlewares/validators.js';
import { authLimiter } from '../middlewares/security.js';

const router = express.Router();

// Existing routes
router.post('/register', authLimiter, validateRegister, validateRequest, authController.register);
router.post('/login', authLimiter, validateLogin, validateRequest, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);

// Email verification routes
router.post('/verify-email-token', authController.verifyEmailToken);
router.post('/verify-email-otp', authController.verifyEmailOTP);
router.post('/resend-verification', authLimiter, authController.resendVerificationEmail);

// Password reset routes
router.post('/request-password-reset', authLimiter, authController.requestPasswordReset);
router.post('/reset-password-token', authLimiter, authController.resetPasswordToken);
router.post('/reset-password-otp', authLimiter, authController.resetPasswordOTP);

export default router;

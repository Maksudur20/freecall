// Authentication routes
import express from 'express';
import authController from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { validateRegister, validateLogin } from '../middlewares/validators.js';
import { authLimiter } from '../middlewares/security.js';

const router = express.Router();

router.post('/register', authLimiter, validateRegister, validateRequest, authController.register);
router.post('/login', authLimiter, validateLogin, validateRequest, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);

export default router;

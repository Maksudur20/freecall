/**
 * Token and OTP Service
 * Generates and validates secure tokens for email verification and password reset
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { setCacheValue, getCacheValue, deleteCacheValue, isRedisAvailable } from './cache.js';

/**
 * Generate secure OTP (6 digits)
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes (default: 32)
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash token (one-way hashing for security storage)
 * @param {string} token - Token to hash
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify token hash
 */
export const verifyTokenHash = (token, hash) => {
  const tokenHash = hashToken(token);
  return crypto.timingsSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
};

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Object} { token, otp, expiresAt }
 */
export const generateEmailVerificationToken = (userId, email) => {
  const token = generateSecureToken();
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    token,
    otp,
    tokenHash: hashToken(token),
    expiresAt,
    expiresIn: '24h',
  };
};

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @returns {Object} { token, otp, expiresAt }
 */
export const generatePasswordResetToken = (userId) => {
  const token = generateSecureToken();
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return {
    token,
    otp,
    tokenHash: hashToken(token),
    expiresAt,
    expiresIn: '1h',
  };
};

/**
 * Store verification token in Redis/Memory
 * @param {string} userId - User ID
 * @param {string} tokenHash - Hashed token
 * @param {string} otp - OTP code
 * @param {Date} expiresAt - Expiration time
 */
export const storeVerificationToken = async (userId, tokenHash, otp, expiresAt) => {
  const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
  const key = `email_verification:${userId}`;
  const data = {
    tokenHash,
    otp,
    expiresAt: expiresAt.toISOString(),
  };

  if (isRedisAvailable()) {
    await setCacheValue(key, data, ttl);
  } else {
    // Fallback: Store in memory (will be lost on restart)
    // In production, consider storing in database
    global.verificationTokens = global.verificationTokens || {};
    global.verificationTokens[key] = { ...data, expiresAt };
  }
};

/**
 * Store password reset token
 */
export const storePasswordResetToken = async (userId, tokenHash, otp, expiresAt) => {
  const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
  const key = `password_reset:${userId}`;
  const data = {
    tokenHash,
    otp,
    expiresAt: expiresAt.toISOString(),
  };

  if (isRedisAvailable()) {
    await setCacheValue(key, data, ttl);
  } else {
    global.passwordResetTokens = global.passwordResetTokens || {};
    global.passwordResetTokens[key] = { ...data, expiresAt };
  }
};

/**
 * Verify email verification token
 * @param {string} userId - User ID
 * @param {string} token - Verification token
 * @returns {Object} { valid, otp, message }
 */
export const verifyEmailVerificationToken = async (userId, token) => {
  const key = `email_verification:${userId}`;
  
  let tokenData = null;
  
  if (isRedisAvailable()) {
    tokenData = await getCacheValue(key);
  } else {
    tokenData = global.verificationTokens?.[key];
  }

  if (!tokenData) {
    return { valid: false, message: 'Verification token not found or expired' };
  }

  // Check expiration
  const expiresAt = new Date(tokenData.expiresAt);
  if (Date.now() > expiresAt.getTime()) {
    // Clean up
    await deleteVerificationToken(userId);
    return { valid: false, message: 'Verification token has expired' };
  }

  // Verify token hash
  try {
    const tokenHash = hashToken(token);
    if (tokenHash !== tokenData.tokenHash) {
      return { valid: false, message: 'Invalid verification token' };
    }

    // Clean up after verification
    await deleteVerificationToken(userId);

    return { valid: true, message: 'Email verified successfully' };
  } catch (error) {
    return { valid: false, message: 'Token verification failed' };
  }
};

/**
 * Verify OTP for email verification
 */
export const verifyEmailOTP = async (userId, otp) => {
  const key = `email_verification:${userId}`;
  
  let tokenData = null;
  
  if (isRedisAvailable()) {
    tokenData = await getCacheValue(key);
  } else {
    tokenData = global.verificationTokens?.[key];
  }

  if (!tokenData) {
    return { valid: false, message: 'OTP not found or expired' };
  }

  // Check expiration
  const expiresAt = new Date(tokenData.expiresAt);
  if (Date.now() > expiresAt.getTime()) {
    await deleteVerificationToken(userId);
    return { valid: false, message: 'OTP has expired' };
  }

  // Verify OTP
  if (tokenData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }

  // Clean up after verification
  await deleteVerificationToken(userId);

  return { valid: true, message: 'Email verified successfully' };
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = async (userId, token) => {
  const key = `password_reset:${userId}`;
  
  let tokenData = null;
  
  if (isRedisAvailable()) {
    tokenData = await getCacheValue(key);
  } else {
    tokenData = global.passwordResetTokens?.[key];
  }

  if (!tokenData) {
    return { valid: false, message: 'Reset token not found or expired' };
  }

  // Check expiration
  const expiresAt = new Date(tokenData.expiresAt);
  if (Date.now() > expiresAt.getTime()) {
    await deletePasswordResetToken(userId);
    return { valid: false, message: 'Reset token has expired' };
  }

  // Verify token hash
  try {
    const tokenHash = hashToken(token);
    if (tokenHash !== tokenData.tokenHash) {
      return { valid: false, message: 'Invalid reset token' };
    }

    return { valid: true, message: 'Token verified' };
  } catch (error) {
    return { valid: false, message: 'Token verification failed' };
  }
};

/**
 * Verify OTP for password reset
 */
export const verifyPasswordResetOTP = async (userId, otp) => {
  const key = `password_reset:${userId}`;
  
  let tokenData = null;
  
  if (isRedisAvailable()) {
    tokenData = await getCacheValue(key);
  } else {
    tokenData = global.passwordResetTokens?.[key];
  }

  if (!tokenData) {
    return { valid: false, message: 'OTP not found or expired' };
  }

  // Check expiration
  const expiresAt = new Date(tokenData.expiresAt);
  if (Date.now() > expiresAt.getTime()) {
    await deletePasswordResetToken(userId);
    return { valid: false, message: 'OTP has expired' };
  }

  // Verify OTP
  if (tokenData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }

  return { valid: true, message: 'OTP verified' };
};

/**
 * Delete verification token
 */
export const deleteVerificationToken = async (userId) => {
  const key = `email_verification:${userId}`;
  
  if (isRedisAvailable()) {
    await deleteCacheValue(key);
  } else {
    delete global.verificationTokens?.[key];
  }
};

/**
 * Delete password reset token
 */
export const deletePasswordResetToken = async (userId) => {
  const key = `password_reset:${userId}`;
  
  if (isRedisAvailable()) {
    await deleteCacheValue(key);
  } else {
    delete global.passwordResetTokens?.[key];
  }
};

/**
 * Generate JWT email verification link
 */
export const generateEmailVerificationLink = (userId, token, baseURL) => {
  return `${baseURL}/api/auth/verify-email?userId=${userId}&token=${token}`;
};

/**
 * Generate password reset link
 */
export const generatePasswordResetLink = (userId, token, baseURL) => {
  return `${baseURL}/api/auth/reset-password?userId=${userId}&token=${token}`;
};

export default {
  generateOTP,
  generateSecureToken,
  hashToken,
  verifyTokenHash,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  storeVerificationToken,
  storePasswordResetToken,
  verifyEmailVerificationToken,
  verifyEmailOTP,
  verifyPasswordResetToken,
  verifyPasswordResetOTP,
  deleteVerificationToken,
  deletePasswordResetToken,
  generateEmailVerificationLink,
  generatePasswordResetLink,
};

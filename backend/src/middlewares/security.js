// Security Middleware - Sanitization, XSS prevention, and rate limiting
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';

// ==================== SANITIZATION MIDDLEWARE ====================

/**
 * Sanitize all request data (body, params, query)
 * Prevents NoSQL injection and removes malicious characters
 */
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Suspicious data detected in ${key}: MongoDB injection attempt blocked`);
  },
});

/**
 * XSS Protection middleware
 * Cleans HTML/JS in user inputs
 */
export const xssProtection = xssClean();

/**
 * Content Security Policy middleware
 */
export const cspMiddleware = (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' *; frame-ancestors 'none';"
  );
  next();
};

// ==================== RATE LIMITING ====================

/**
 * Global rate limiter - 15 minutes, 100 requests
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  },
  skip: (req, res) => {
    // Don't rate limit health check
    return req.path === '/api/health';
  },
});

/**
 * Strict rate limiter for auth routes
 * 5 minutes, 5 requests per IP
 */
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per IP
  message: 'Too many login/register attempts. Please try again after 5 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});

/**
 * Moderate rate limiter for API routes
 * 15 minutes, 30 requests
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // requests per windowMs
  message: 'Too many API requests, please try again later.',
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
});

/**
 * Strict rate limiter for sensitive operations
 * 1 hour, 10 requests
 */
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many requests for this operation. Please try again later.',
  skipSuccessfulRequests: false,
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
});

/**
 * Upload limiter - 10 MB files, 5 uploads per 10 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 uploads per 10 minutes
  message: 'Too many uploads. Please try again later.',
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
});

/**
 * Message limiter - Prevent spam
 * 1 minute, 20 messages
 */
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: 'You are sending messages too quickly. Please slow down.',
  skipSuccessfulRequests: false,
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
});

/**
 * Search limiter - Prevent search abuse
 * 1 minute, 30 searches
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Too many search requests. Please try again later.',
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
});

/**
 * Call limiter - Prevent call spam
 * 1 minute, 10 calls
 */
export const callLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 call initiations per minute
  message: 'Too many call requests. Please try again later.',
  skipSuccessfulRequests: false,
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
});

// ==================== SECURITY HEADERS MIDDLEWARE ====================

/**
 * Additional security headers beyond Helmet
 */
export const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // HSTS - Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// ==================== INPUT VALIDATION HELPERS ====================

/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Sanitize string input - remove dangerous characters
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate strong password
 */
export const isStrongPassword = (password) => {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) && // lowercase
    /[A-Z]/.test(password) && // uppercase
    /[0-9]/.test(password) // numbers
  );
};

/**
 * Sanitize user object - remove sensitive fields
 */
export const sanitizeUserObject = (user) => {
  const sanitized = user.toObject?.() || user;
  
  delete sanitized.password;
  delete sanitized.refreshToken;
  delete sanitized.__v;
  
  return sanitized;
};

/**
 * Rate limit store for distributed systems (optional Redis)
 */
export const getRateLimitStore = () => {
  // For now, using in-memory store (default)
  // In production, use Redis store for distributed rate limiting
  if (process.env.REDIS_URL) {
    // TODO: Implement Redis store
    console.log('Redis rate limit store not yet implemented');
  }
  return null;
};

export default {
  sanitizeInput,
  xssProtection,
  cspMiddleware,
  securityHeaders,
  globalLimiter,
  authLimiter,
  apiLimiter,
  sensitiveOperationLimiter,
  uploadLimiter,
  messageLimiter,
  searchLimiter,
  callLimiter,
  isValidObjectId,
  sanitizeString,
  isValidEmail,
  isStrongPassword,
  sanitizeUserObject,
};

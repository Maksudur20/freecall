# Security Implementation Guide

## Overview
This document outlines all security measures implemented in the FreeCall backend application. The application follows OWASP security best practices and uses industry-standard packages to protect against common vulnerabilities.

---

## 1. Security Middleware Stack

### 1.1 Helmet.js
**Purpose**: Sets various HTTP headers to enhance application security.

**Implementation**:
```javascript
app.use(helmet());
```

**Protection Against**:
- XSS (Cross-Site Scripting) attacks
- Clickjacking
- MIME type sniffing
- Unexpected content type handling

**Headers Set**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS)
- `Content-Security-Policy` variations

---

### 1.2 CORS (Cross-Origin Resource Sharing)
**Purpose**: Restricts cross-origin requests to trusted domains.

**Implementation**:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
```

**Configuration**:
- Whitelist specific origins via `CORS_ORIGIN` environment variable
- Allow credentials (cookies, authorization headers)
- Restrict preflight requests to safe methods

**Setup**:
```env
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

---

### 1.3 MongoDB Injection Prevention (express-mongo-sanitize)
**Purpose**: Prevents NoSQL injection attacks by sanitizing user input.

**Implementation**:
```javascript
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());
```

**Protection Against**:
- NoSQL injection: `{"$ne": null}` patterns
- MongoDB query operators in POST/GET requests
- JavaScript code injection in data

**How It Works**:
- Replaces prohibited characters (`$`, `.`) with `_`
- Sanitizes `request.body`, `request.params`, `request.query`
- Can be customized to replace or remove suspicious data

**Custom Configuration**:
```javascript
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Suspicious data detected in ${key}: MongoDB injection attempt blocked`);
  },
});
```

---

### 1.4 XSS Protection (xss-clean)
**Purpose**: Sanitizes input to prevent Cross-Site Scripting (XSS) attacks.

**Implementation**:
```javascript
import xssClean from 'xss-clean';
app.use(xssClean());
```

**Protection Against**:
- Embedded JavaScript code in form data
- HTML injection
- Script tag execution
- Event handler attributes (onclick, etc.)

**How It Works**:
- Removes/escapes HTML tags and JavaScript code
- Cleans all request data (body, params, query)
- Preserves safe HTML if needed (configurable)

**Example**:
```
Input:  { message: '<script>alert("XSS")</script>' }
Output: { message: '&lt;script&gt;alert("XSS")&lt;/script&gt;' }
```

---

## 2. Rate Limiting

Rate limiting prevents abuse and attacks like brute force, DDoS, and spam.

### 2.1 Authentication Rate Limiter
**Purpose**: Protects auth endpoints from brute force attacks.

**Configuration**:
- Window: 5 minutes
- Max requests: 5 per IP
- Skips successful requests (allows retries after login)

**Usage** (in auth.js):
```javascript
router.post('/login', authLimiter, validateLogin, validateRequest, authController.login);
router.post('/register', authLimiter, validateRegister, validateRequest, authController.register);
```

### 2.2 API Rate Limiter
**Purpose**: Limits general API requests.

**Configuration**:
- Window: 15 minutes
- Max requests: 30 per user/IP

**Features**:
- User-based limiting when authenticated (by `req.user.id`)
- Falls back to IP-based limiting for unauthenticated requests
- Provides rate limit headers in response

### 2.3 Message Limiter
**Purpose**: Prevents message spam.

**Configuration**:
- Window: 1 minute
- Max messages: 20 per user
- Applies to WebSocket message events

### 2.4 Upload Limiter
**Purpose**: Prevents upload abuse.

**Configuration**:
- Window: 10 minutes
- Max uploads: 5 per user
- Works with file size limits (50MB via express.json limit)

### 2.5 Sensitive Operation Limiter
**Purpose**: Protects critical operations like password changes.

**Configuration**:
- Window: 1 hour
- Max requests: 10 per user
- Applied to password change, 2FA setup, etc.

---

## 3. Input Validation

Input validation is the first line of defense against malicious data.

### 3.1 Express-Validator Setup
**Location**: `src/middlewares/validators.js`

**Validated Fields**:

#### Authentication
- **Username**: 3-30 characters, alphanumeric with `-` and `_`
- **Email**: RFC 5322 compliant, normalized to lowercase
- **Password**: Min 8 chars, requires uppercase, lowercase, numbers
- **Confirmation**: Passwords must match

#### User Profile
- **Bio**: Max 500 characters
- **Status**: Enum validation (online, away, idle, offline)
- **User ID**: Validates MongoDB ObjectId format (24 hex characters)

#### Messages & Chat
- **Conversation ID**: MongoDB ObjectId validation
- **Message Text**: Max 5000 characters
- **Media URLs**: Array with max 10 items
- **Participant IDs**: Each must be valid ObjectId

### 3.2 Validation Middleware Flow
```
Incoming Request
    ↓
Input Validation (express-validator)
    ↓
Data Sanitization (mongo-sanitize, xss-clean)
    ↓
Validation Result Check (validateRequest middleware)
    ↓
Route Handler
```

---

## 4. Authentication & Authorization

### 4.1 JWT Token Strategy
**Implementation**:
- Access tokens: Short-lived (15 minutes typical)
- Refresh tokens: Long-lived (7 days typical)
- Stored in secure HTTP-only cookies

**Token Structure**:
```javascript
// In token payload
{
  userId: user._id,
  iat: issuedAtTime,
  exp: expirationTime
}
```

### 4.2 Password Security
**Implementation**:
- Hashing: bcryptjs with salt rounds = 10
- Never store plain text passwords
- Enforce strong password requirements

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### 4.3 Token Verification Middleware
**Location**: `src/middlewares/auth.js`

```javascript
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

---

## 5. Environment Variables & Secrets

### 5.1 Required Environment Variables
```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-key
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: External Services
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
REDIS_URL=redis://localhost:6379
```

### 5.2 Secrets Management Best Practices
- ✅ Use `.env` for development only
- ✅ Rotate secrets regularly in production
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use environment variables, not hardcoded values
- ✅ Never commit `.env` to version control
- ✅ Use strong random strings (min 32 characters for secrets)

---

## 6. Data Validation & Sanitization Layers

### 6.1 Multi-Layer Sanitization
```
Raw Input
    ↓
⚠️ sanitizeInput (mongo-sanitize)    → Remove $ and . characters
    ↓
⚠️ xssProtection (xss-clean)         → Escape HTML/JS
    ↓
⚠️ express-validator                 → Type and format validation
    ↓
Clean Data → Database/Response
```

### 6.2 Example: Unsafe vs. Safe Input
```javascript
// UNSAFE input
{
  "username": "user",
  "password": "pass$word",
  "bio": "<script>alert('xss')</script>"
}

// After sanitization
{
  "username": "user",
  "password": "pass_word",
  "bio": "&lt;script&gt;alert('xss')&lt;/script&gt;"
}

// After validation
{
  "username": "user",
  "password": "pass_word",    // ❌ Fails: must meet complexity requirements
  "bio": "&lt;script&gt;alert('xss')&lt;/script&gt;"
}
```

---

## 7. HTTP Security Headers

### 7.1 Headers Set by Helmet
```
X-Content-Type-Options: nosniff
  → Prevents MIME type sniffing

X-Frame-Options: DENY
  → Prevents clickjacking (disallows iframe embedding)

X-XSS-Protection: 1; mode=block
  → Browser XSS filter (legacy)

Strict-Transport-Security: max-age=31536000; includeSubDomains
  → Forces HTTPS (1 year)

Content-Security-Policy: default-src 'self'
  → Restricts resource loading to same origin

Referrer-Policy: strict-origin-when-cross-origin
  → Controls referrer information leakage
```

### 7.2 Custom CSP Header (Optional)
```javascript
export const cspMiddleware = (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  next();
};
```

---

## 8. Socket.IO Security

### 8.1 CORS Configuration for WebSockets
```javascript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});
```

### 8.2 WebSocket Authentication
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});
```

### 8.3 Message Security in WebSocket
- Validate and sanitize all socket messages
- Rate limit socket events by user
- Don't emit sensitive data to unintended recipients
- Verify user permissions before emitting

---

## 9. Database Security

### 9.1 MongoDB Security
**Configuration**:
- Use username/password authentication
- Enable network access control (whitelist IPs)
- Use TLS/SSL for connections
- Enable MongoDB authentication in connection string

**Connection String**:
```env
MONGODB_URI=mongodb+srv://user:password@cluster0.mongodb.net/dbname?retryWrites=true&w=majority&ssl=true
```

### 9.2 Password Storage
```javascript
// Hashing on registration
const hashedPassword = await bcrypt.hash(password, 10);

// Verification on login
const isMatch = await bcrypt.compare(inputPassword, storedHash);
```

---

## 10. File Upload Security

### 10.1 Upload Validation
**File Type Restrictions**:
```javascript
const validMimes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/quicktime'
];

const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov'];
```

**Size Limits**:
```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

**Upload Limiter**:
- 5 uploads per 10 minutes per user
- Applied via `uploadLimiter` middleware

### 10.2 File Storage (Cloudinary)
- Uses cloud storage instead of local server
- Automatic virus scanning (enterprise feature)
- CDN delivery
- Automatic backups

---

## 11. Error Handling Security

### 11.1 Error Response Strategy
**Production (Avoid Information Leakage)**:
```javascript
// ❌ DO NOT SEND DETAILED ERRORS
res.status(500).json({
  error: 'Database connection failed at localhost:27017',
  stack: 'Error: ECONNREFUSED...'
});

// ✅ SEND GENERIC ERRORS
res.status(500).json({
  error: 'An error occurred. Please try again later.'
});
```

### 11.2 Error Handler Middleware
**Location**: `src/middlewares/errorHandler.js`

```javascript
export default (err, req, res, next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error'
    : err.message;
  
  res.status(status).json({ error: message });
};
```

---

## 12. Security Best Practices Checklist

### Development
- [ ] Use `.env.example` with dummy values (commit to repo)
- [ ] Never commit `.env` or secret keys
- [ ] Implement HTTPS in production
- [ ] Use strong JWT secrets (min 32 characters, random)
- [ ] Run `npm audit` regularly and update dependencies
- [ ] Implement logging for security events
- [ ] Test with OWASP Top 10 vulnerabilities in mind

### Deployment
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Use environment variables (not dotenv in production)
- [ ] Rotate JWT secrets periodically
- [ ] Monitor rate limit logs for attack patterns
- [ ] Enable database authentication and encryption
- [ ] Whitelist specific CORS origins
- [ ] Use firewall/WAF rules
- [ ] Regular security audits and penetration testing
- [ ] Implement request/response logging

### Monitoring & Logging
- [ ] Log authentication failures
- [ ] Log rate limit violations
- [ ] Log data sanitization events
- [ ] Monitor for suspicious patterns
- [ ] Set up alerts for security events

---

## 13. Common Attacks & Mitigations

| Attack | Vulnerability | Mitigation |
|--------|---------------|-----------|
| **SQL/NoSQL Injection** | Unsanitized input in queries | mongo-sanitize, parameterized queries |
| **XSS (Cross-Site Scripting)** | Unescaped user input in HTML | xss-clean, CSP headers |
| **CSRF (Cross-Site Request Forgery)** | Unauthorized state-changing requests | CORS restrictions, SameSite cookies |
| **Brute Force** | Multiple login attempts | Rate limiting (authLimiter) |
| **DDoS** | Excessive requests | Rate limiting (apiLimiter, globalLimiter) |
| **Man-in-the-Middle** | Unencrypted communication | HTTPS, HSTS header |
| **Clickjacking** | UI redressing attacks | X-Frame-Options: DENY |
| **Sensitive Data Exposure** | Unencrypted data transmission | HTTPS, TLS |
| **Insecure Deserialization** | Arbitrary code execution | Input validation |
| **Weak Passwords** | Password guessing | Password complexity rules |

---

## 14. Running Security Audits

### NPM Audit
```bash
# Check for vulnerabilities
npm audit

# Fix automatically (non-breaking)
npm audit fix

# Fix with breaking changes
npm audit fix --force
```

### Regular Updates
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update
npm update --legacy-peer-deps
```

---

## 15. Incident Response

### If a Data Breach Occurs
1. **Immediately** disable affected user accounts/tokens
2. **Notify** affected users within 24 hours
3. **Rotate** all secrets and JWT keys
4. **Review** logs to identify attack vector
5. **Patch** the vulnerability
6. **Audit** the entire codebase for similar issues
7. **Update** password reset requirements
8. **Monitor** for suspicious activity

### Rate Limit Abuse
```javascript
// Check rate limit logs
const suspiciousIPs = logs.filter(log => 
  log.type === 'RATE_LIMIT_EXCEEDED'
).map(log => log.ip);

// Block via firewall/WAF
suspiciousIPs.forEach(ip => firewall.block(ip));
```

---

## 16. Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [JWT Security Best Practices](https://auth0.com/blog/json-web-token-jwt-best-current-practices/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/)

---

## Summary

The FreeCall backend implements **defense-in-depth** security:

1. **Input Layer**: Validation & sanitization (validators, mongo-sanitize, xss-clean)
2. **Authentication Layer**: JWT tokens, password hashing, rate limiting
3. **Transport Layer**: HTTPS, security headers (Helmet)
4. **Application Layer**: CORS, error handling, authorization middleware
5. **Data Layer**: MongoDB authentication, TLS encryption
6. **Monitoring Layer**: Logging, audit trails, security alerts

This layered approach ensures that even if one defense is breached, others remain effective.


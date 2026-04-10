# 🚀 FreeCall - Production Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database backed up
- [ ] Security review completed
- [ ] Load testing done
- [ ] Monitoring setup
- [ ] Error tracking configured (Sentry)
- [ ] CDN configured
- [ ] SSL certificates ready

---

## 1. Environment Configuration

### Backend Production (.env)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freecall

# JWT
JWT_SECRET=generate_a_secure_random_string_min_32_chars
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=generate_another_secure_string_min_32_chars
REFRESH_TOKEN_EXPIRE=30d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Redis
REDIS_URL=redis://:password@host:port/database

# File uploads
MAX_FILE_SIZE=52428800
UPLOAD_DIR=/uploads

# Email (optional)
MAIL_SERVICE=sendgrid
MAIL_API_KEY=your_sendgrid_api_key

# WebRTC (optional)
STUN_SERVERS=stun:stun.l.google.com:19302
TURN_SERVER=turn:turnserver.com:3478
TURN_USERNAME=username
TURN_PASSWORD=password

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn

# AWS (if using S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Frontend Production (.env.production)

```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_APP_NAME=FreeCall
```

---

## 2. Docker Deployment

### Build Images

```bash
# Build backend image
docker build -t freecall-backend:latest ./backend

# Build frontend image (create Dockerfile first)
docker build -t freecall-frontend:latest ./frontend
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - freecall-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - freecall-network
    restart: unless-stopped

  backend:
    image: freecall-backend:latest
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/freecall
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
    depends_on:
      - mongodb
      - redis
    networks:
      - freecall-network
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    image: freecall-frontend:latest
    ports:
      - "80:3000"
    environment:
      VITE_API_URL: https://api.yourdomain.com
      VITE_SOCKET_URL: https://api.yourdomain.com
    networks:
      - freecall-network
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:

networks:
  freecall-network:
    driver: bridge
```

---

## 3. Cloud Deployment

### Railway (Recommended for simplicity)

#### 1. Deploy Backend

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Create backend service
railway add --from-repo https://github.com/yourusername/freecall

# Set environment variables
railway variables add MONGODB_URI=your_mongodb_uri
railway variables add JWT_SECRET=your_secret
# ... add all other variables

# Deploy
railway up
```

#### 2. Deploy Frontend

```bash
# Create new Railway project for frontend
railway init --empty

# Add Dockerfile to frontend
# (See section below)

# Deploy
railway up
```

### Vercel (Frontend Only)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel deploy --prod

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://your-backend-api.com
# VITE_SOCKET_URL=https://your-backend-api.com
```

### AWS Deployment

#### EC2 Instance

```bash
# SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb-org

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Clone repository
git clone https://github.com/yourusername/freecall.git
cd freecall

# Install dependencies
npm run install:all

# Create .env files with production settings
nano backend/.env
nano frontend/.env.production

# Build frontend
npm run build:frontend

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
# (See Nginx config below)

# Start backend
npm run start &

# Start Nginx
sudo systemctl start nginx
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        root /path/to/freecall/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 4. Database

### MongoDB Atlas Setup

1. Create account at mongodb.com/cloud
2. Create cluster
3. Add IP whitelist
4. Create database user
5. Get connection string
6. Add to .env: `MONGODB_URI`

### Backup Strategy

```bash
# Automatic daily backup
# Add to crontab (0 2 * * * = daily at 2 AM)

# Create backup directory
mkdir -p /backups/mongodb

# Backup script
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/freecall" --out=$BACKUP_DIR/$DATE

# Keep only last 30 days
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;
```

---

## 5. SSL/HTTPS

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo certbot certificates
```

---

## 6. Monitoring & Logging

### Sentry (Error Tracking)

```javascript
// Add to backend
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: "freecall-backend",
    script: "./src/server.js",
    env: {
      NODE_ENV: "production"
    },
    instances: 4,
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "500M"
  }]
};

# Start
pm2 start ecosystem.config.js

# Monitor
pm2 monit
pm2 logs
```

### CloudWatch/DataDog Metrics

```bash
# Install agent
npm install dd-trace

# Add to application
const tracer = require('dd-trace').init()
```

---

## 7. Performance Optimization

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Optimize images
npm install -g imagemin-cli
imagemin dist/images --out-dir=dist/images-optimized

# Enable Gzip compression in Nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### Database Optimization

```javascript
// Ensure indexes are created
db.users.createIndex({ email: 1 });
db.conversations.createIndex({ participants: 1 });
db.messages.createIndex({ conversationId: 1, createdAt: -1 });
```

---

## 8. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build backend
        run: npm run build:backend

      - name: Build frontend
        run: npm run build:frontend

      - name: Run tests
        run: npm test

      - name: Deploy to production
        run: |
          # Your deployment script
          ./deploy.sh
```

---

## 9. Security Hardening

```javascript
// Add to backend server.js
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests",
});
app.use("/api/", limiter);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// HTTPS only
app.use((req, res, next) => {
  if (req.header("x-forwarded-proto") !== "https") {
    res.redirect(`https://${req.header("host")}${req.url}`);
  } else {
    next();
  }
});
```

---

## 10. Monitoring Checklist

- [ ] Server uptime monitoring (Uptime Robot)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (ELK Stack)
- [ ] Performance monitoring (DataDog)
- [ ] Database backups
- [ ] Security scanning
- [ ] SSL certificate renewal
- [ ] Disk space monitoring

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs freecall-backend

# Verify environment variables
node -e "console.log(process.env)"

# Test database connection
mongosh "your-connection-string"
```

### Socket.io connection issues
```bash
# Check firewall
sudo ufw allow 5000
sudo ufw allow 443

# Verify Socket.io configuration
# Check that CORS is properly configured
```

### Out of memory
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Use PM2 to auto-restart if exceeds limit
# max_memory_restart: "500M"
```

---

## Production Checklist

- [ ] HTTPS/SSL enabled
- [ ] Environment variables set
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] File upload limits set
- [ ] Logs being collected
- [ ] Security headers set
- [ ] Cache headers configured
- [ ] Database indexes created
- [ ] API documentation ready
- [ ] Load balancing setup
- [ ] Disaster recovery plan

---

**Estimated Deployment Time**: 2-4 hours
**Recommended Provider**: Railway (easiest) or AWS (most control)
**Support**: Check logs and error tracking for issues

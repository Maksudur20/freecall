# 🔧 FreeCall - Troubleshooting Guide

## Common Issues & Solutions

---

## Backend Issues

### 1. MongoDB Connection Fails

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions**:
- Check if MongoDB is running: `mongod --version`
- Start MongoDB locally:
  ```bash
  # Windows
  net start MongoDB
  
  # macOS
  brew services start mongodb-community
  
  # Linux
  sudo systemctl start mongod
  ```
- If using MongoDB Atlas, verify connection string in `.env`
- Check firewall isn't blocking port 27017
- Ensure IP whitelist includes your IP in MongoDB Atlas

### 2. Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
- Change port in `.env`: `PORT=5001`
- Kill process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -i :5000
  kill -9 <PID>
  ```

### 3. JWT Token Errors

**Error**: `Error: invalid token` or `Error: token expired`

**Solutions**:
- Ensure `JWT_SECRET` is set in `.env`
- Check token hasn't expired (default: 7 days)
- Use refresh token endpoint to get new token
- Clear localStorage and login again
- Verify token format in Authorization header: `Bearer <token>`

### 4. CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solutions**:
- Update `CORS_ORIGIN` in `.env` to match frontend URL
- For local development: `CORS_ORIGIN=http://localhost:3000`
- Ensure credentials are allowed:
  ```javascript
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
  ```

### 5. Socket.io Connection Fails

**Error**: `WebSocket connection failed` or `Failed to connect`

**Solutions**:
- Verify Socket.io is initialized on server
- Check port 5000 is accessible
- For production, ensure WebSocket upgrade is allowed in proxy/firewall
- Update `SOCKET_URL` in frontend `.env`
- Check browser console for detailed error

### 6. Large File Upload Fails

**Error**: `413 Payload Too Large` or `Request entity too large`

**Solutions**:
- Increase `MAX_FILE_SIZE` in `.env`: `MAX_FILE_SIZE=52428800` (50MB)
- Update Express middleware limit:
  ```javascript
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb' }));
  ```
- Check nginx/reverse proxy limits in production

### 7. Image Processing Fails

**Error**: `Error: ENOENT: no such file or directory`

**Solutions**:
- Ensure Sharp is installed: `npm install sharp`
- Create uploads directory: `mkdir -p uploads`
- Check file permissions on uploads folder
- Verify Node.js has write permissions

### 8. Out of Memory

**Error**: `JavaScript heap out of memory` or `FATAL ERROR`

**Solutions**:
- Increase Node.js memory:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm start
  ```
- Check for memory leaks in code
- Implement pagination for large data queries
- Use Redis for caching

### 9. Database Query Timeout

**Error**: `Query timeout exceeded` or `ECONNREFUSED`

**Solutions**:
- Check MongoDB is running
- Verify database indexes exist
- Optimize queries (add pagination, lean())
- Increase connection timeout in `.env`
- Check for circular references in schemas

### 10. Missing Environment Variables

**Error**: `Error: MONGODB_URI is required` or `undefined`

**Solutions**:
- Create `.env` file from `.env.example`
- Ensure all required variables are set
- Restart server after updating `.env`
- Check for typos in variable names
- Use `console.log(process.env)` to verify

---

## Frontend Issues

### 1. Build Fails

**Error**: `[vite] error while updating dependencies`

**Solutions**:
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- Clear Vite cache: `rm -rf .vite`
- Check Node.js version (should be 16+): `node --version`
- Clear npm cache: `npm cache clean --force`

### 2. Module Not Found

**Error**: `Module not found: Can't resolve '@components/...'`

**Solutions**:
- Check import path matches folder structure
- Verify path aliases in `vite.config.js`
- Ensure file extension is included (e.g., `.jsx`, `.js`)
- Check for typos in import statements
- Restart dev server

### 3. State Not Updating

**Error**: Components don't update when Zustand store changes

**Solutions**:
- Ensure hooks are called at top level (not in conditions)
- Verify store actions are using `set()` properly
- Check store isn't being reset on navigation
- Use `shallow` equality check if needed:
  ```javascript
  const messages = useStore((state) => state.messages, shallow)
  ```
- Verify Zustand version compatibility

### 4. Socket.io Not Connecting

**Error**: `Socket not connected` or WebSocket errors

**Solutions**:
- Check backend is running: `npm run dev:backend`
- Verify `VITE_SOCKET_URL` in `.env.local`
- Ensure authentication token is set
- Check browser console for specific error
- Test with: `socket.on('connect', () => console.log('Connected'))`

### 5. Infinite Render Loop

**Error**: Excessive API calls or React warnings about dependencies

**Solutions**:
- Check useEffect dependencies
- Avoid creating new objects/arrays in render
- Use `useCallback` for event handlers
- Verify API calls aren't triggering renders
- Add console.log to trace render cause

### 6. Dark Mode Not Working

**Error**: Dark mode toggle doesn't persist or apply

**Solutions**:
- Verify `dark` class is on root element
- Check Tailwind CSS dark mode config
- Ensure localStorage is enabled
- Test in browser DevTools: `document.documentElement.classList.toggle('dark')`
- Clear browser cache

### 7. API Calls Return 401

**Error**: `401 Unauthorized` on protected endpoints

**Solutions**:
- Verify token is in localStorage: `localStorage.getItem('token')`
- Check token isn't expired: `jwt.decode(token)`
- Refresh token using refresh endpoint
- Clear localStorage and login again
- Verify Authorization header is sent correctly

### 8. Images Not Loading

**Error**: 404 or CORS errors for image URLs

**Solutions**:
- Check image URL is correct
- Verify image exists on server
- Check CORS configuration allows image domain
- Verify image upload succeeded
- Check file permissions on uploads directory

### 9. Lazy Loading Pages Fail

**Error**: `ChunkLoadError` or blank page when navigating

**Solutions**:
- Verify page component file exists
- Check lazy import syntax is correct:
  ```javascript
  const Page = lazy(() => import('./pages/Page'))
  ```
- Ensure all dependencies are installed
- Clear browser cache and rebuild
- Check for circular dependencies

### 10. Tailwind Styles Not Applied

**Error**: Classes don't work or styles missing

**Solutions**:
- Rebuild Tailwind: `npm run build:frontend`
- Check `tailwind.config.js` includes correct content paths
- Verify PostCSS is configured
- Clear Tailwind cache: `rm -rf .next` or similar
- Check class names are spelled correctly

---

## Docker Issues

### 1. Container Won't Start

**Error**: `docker: Error response from daemon`

**Solutions**:
- Check Docker is running: `docker ps`
- View logs: `docker logs <container_id>`
- Rebuild image: `docker build -t freecall-backend .`
- Check Dockerfile syntax

### 2. Port Binding Fails

**Error**: `docker: Error response from daemon: driver failed programming external connectivity`

**Solutions**:
- Port already in use: `docker ps | grep 5000`
- Use different port: `docker run -p 5001:5000 ...`
- Stop conflicting container: `docker stop <container_id>`

### 3. Volume Mounting Issues

**Error**: `Invalid volume specification`

**Solutions**:
- Use absolute paths in docker-compose.yml
- Windows: Use forward slashes: `C:/path/to/dir`
- Check path exists: `-v /absolute/path:/container/path`

### 4. Environment Variables Not Set

**Error**: `MONGODB_URI is required` inside container

**Solutions**:
- Pass with `-e`: `docker run -e MONGODB_URI=... ...`
- Or mount .env file: `-v $(pwd)/.env:/app/.env`
- Or in docker-compose.yml:
  ```yaml
  environment:
    MONGODB_URI: your_uri
  ```

---

## Deployment Issues

### 1. Railway Deployment Fails

**Error**: Deployment stops or shows error

**Solutions**:
- Check logs in Railway dashboard
- Verify all required environment variables are set
- Ensure package.json has correct `start` script
- Check build script exists and runs successfully

### 2. AWS EC2 Connection Issues

**Error**: `Permission denied (publickey)` or `Connection timeout`

**Solutions**:
- Check key file permissions: `chmod 400 key.pem`
- Verify security group allows SSH (port 22)
- Use correct username: `ubuntu` for Ubuntu AMI
- Check instance is running in AWS console

### 3. SSL Certificate Issues

**Error**: `ERR_CERT_AUTHORITY_INVALID` or certificate warnings

**Solutions**:
- Renew certificate: `certbot renew`
- Check certificate validity: `certbot certificates`
- Verify Nginx points to correct cert paths
- Check domain DNS resolves correctly

### 4. Database Backup Fails

**Error**: `mongodump command not found`

**Solutions**:
- Install MongoDB tools for your system
- Use full path to mongodump
- Verify connection string is correct
- Check permissions on backup directory

---

## Performance Issues

### 1. Slow API Response

**Error**: Requests take > 1000ms

**Solutions**:
- Enable Redis caching
- Add database indexes
- Use pagination for large queries
- Profile with: `console.time()` ... `console.timeEnd()`
- Check network tab in DevTools
- Verify database isn't slow: `db.collection.find().explain('executionStats')`

### 2. High Memory Usage

**Error**: Memory spikes or crashes

**Solutions**:
- Monitor with: `node --inspect app.js`
- Check for memory leaks with Chrome DevTools
- Clear caches periodically
- Limit concurrent connections
- Use `--max-old-space-size` flag

### 3. Large Bundle Size

**Error**: Frontend loads slowly

**Solutions**:
- Check bundle size: `npm run build && npm run analyze`
- Tree-shake unused imports
- Lazy load routes and components
- Compress images
- Enable Gzip in server
- Use CDN for static assets

### 4. Database Query Slowness

**Error**: Queries taking > 100ms

**Solutions**:
- Create indexes on frequently queried fields
- Use `.lean()` for read-only queries
- Implement pagination
- Use projection to limit fields
- Check for N+1 query problems
- Use aggregation pipeline for complex queries

---

## Debugging Tips

### Backend Debugging

```javascript
// Add detailed logging
import debug from 'debug';
const log = debug('freecall:*');

// Use in code
log('User login attempt:', email);

// Run with: DEBUG=freecall:* npm start
```

### Frontend Debugging

```javascript
// React DevTools
// Install browser extension

// Socket.io debugging
socket.on('*', (event, ...args) => {
  console.log('[Socket Event]', event, args);
});

// Zustand debugging
import { useShallow } from 'zustand/react/shallow';
const store = useAuthStore(useShallow(state => state));
```

### Network Debugging

```bash
# Monitor network requests
# Use browser DevTools Network tab

# Check WebSocket connection
# Open DevTools > Network > WS filter
```

---

## Getting Help

If issues persist:

1. **Check logs**: `docker logs` or browser console
2. **Search issues**: GitHub Issues, Stack Overflow
3. **Review documentation**: QUICK_START.md, DEPLOYMENT.md
4. **Try minimal reproduction**: Create simple test case
5. **Ask for help**: Include logs, error messages, steps to reproduce

---

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` | Service not running | Start MongoDB, backend, etc. |
| `ENOENT` | File not found | Check file paths and permissions |
| `CORS error` | Origin mismatch | Update CORS config |
| `Timeout` | Slow database | Add indexes, enable caching |
| `401 Unauthorized` | Invalid token | Refresh or re-login |
| `413 Too Large` | File size limit | Increase limit in config |
| `OOM` | Out of memory | Increase heap or optimize |
| `EADDRINUSE` | Port in use | Use different port |

---

**Version**: 1.0  
**Last Updated**: January 2024

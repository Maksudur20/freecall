# MongoDB Connection Verification Checklist

Use this checklist to verify that your MongoDB Atlas connection is properly configured.

---

## Pre-Setup Verification

### Environment & Dependencies
- [ ] Node.js installed (v16+ recommended)
  ```bash
  node --version
  ```
- [ ] npm installed
  ```bash
  npm --version
  ```
- [ ] All dependencies installed
  ```bash
  npm install
  ```
- [ ] Mongoose is in package.json
  ```bash
  npm list mongoose
  ```

---

## MongoDB Atlas Setup

### Account & Cluster
- [ ] MongoDB Atlas account created
- [ ] Organization/Project created
- [ ] Cluster created (M0 free tier)
- [ ] Cluster status is **Active** (green indicator)
- [ ] Correct region selected (closer to you)

### Network Security
- [ ] IP address whitelisted in **Network Access**
  - For development: `0.0.0.0/0` or your IP
  - View setting: Atlas → Network Access
- [ ] Database user created
  - Username: (e.g., `freecall_user`)
  - Password: (saved securely)
  - Role: "Read and write to any database"
  - View setting: Atlas → Database Access

### Connection String
- [ ] Connection string obtained from **Connect** button
- [ ] Format is correct: `mongodb+srv://username:password@...`
- [ ] Username matches database user
- [ ] Password is correctly URL-encoded (if special chars)
- [ ] Database name included (e.g., `/freecall`)

---

## Local Setup

### .env File
- [ ] `.env` file created in `backend/` directory
  ```bash
  touch .env
  ```
- [ ] File is listed in `.gitignore` (won't be committed)
- [ ] `MONGODB_ATLAS_URI` is set with correct connection string
- [ ] `MONGODB_ATLAS_URI` is the first option (takes priority over `MONGODB_URI`)
- [ ] All quotes are removed from the connection string
- [ ] `JWT_SECRET` is a unique, strong string (32+ characters)
- [ ] `CORS_ORIGIN` is set to your frontend URL

### Configuration Verification
```bash
# View (first/last chars only - not entire secret):
node -e "require('dotenv').config(); 
  const uri = process.env.MONGODB_ATLAS_URI || '';
  console.log('URI format:', uri.substring(0, 30) + '...' + uri.substring(uri.length-20));
  console.log('NODE_ENV:', process.env.NODE_ENV);
"
```

---

## File Structure

### Required Files Exist
- [ ] `src/config/db.js` - Connection file
  ```bash
  test -f src/config/db.js && echo "✓ File exists"
  ```
- [ ] `src/models/User.js` - Sample model
  ```bash
  test -f src/models/User.js && echo "✓ File exists"
  ```
- [ ] `src/server.js` - Main server file
  ```bash
  test -f src/server.js && echo "✓ File exists"
  ```

### Documentation Files
- [ ] `MONGODB_SETUP.md` - Setup guide
- [ ] `MONGODB_QUICK_START.md` - Quick reference
- [ ] `SECURITY.md` - Security best practices
- [ ] `.env.example` - Configuration template
- [ ] `.env.template` - Full template

---

## Code Verification

### Database Connection File
```bash
# Check if db.js imports mongoose
grep -q "import mongoose" src/config/db.js && echo "✓ Mongoose imported"

# Check if exports connectDB
grep -q "export default connectDB" src/config/db.js && echo "✓ connectDB exported"
```

### Server Integration
```bash
# Check if server imports connectDB
grep -q "import connectDB" src/server.js && echo "✓ connectDB imported"

# Check if server awaits connection
grep -q "await connectDB" src/server.js && echo "✓ Connection awaited"
```

### Models
```bash
# List all models
ls -lh src/models/

# Verify each model exports
for file in src/models/*.js; do
  grep -q "export default" "$file" && echo "✓ $(basename $file) exports model"
done
```

---

## Runtime Verification

### Start the Server
```bash
# In the backend directory
npm start
```

### Expected Console Output
```
✓ Check these logs appear in order:
1. ✓ MongoDB connected successfully
2.   Database: freecall
3.   Host: cluster0.xxxxx.mongodb.net
4.   Environment: development
5. 📡 MongoDB connection: Open
6. 🚀 Server running on http://localhost:5000
7. 📡 WebSocket ready for connections
```

- [ ] No error "MongoDB URI not provided"
- [ ] No error "MongoDB connection failed"
- [ ] No error "Cannot find module 'mongoose'"
- [ ] Server starts within 5-10 seconds
- [ ] Port 5000 shows "Server running"

### Test Health Endpoint
```bash
# In another terminal:
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-04-10T..."}
```

- [ ] Request succeeds (no timeout)
- [ ] Returns JSON with "ok" status
- [ ] Shows current timestamp

---

## MongoDB Verification

### In MongoDB Atlas UI

#### Check Database Created
1. Open [MongoDB Atlas Dashboard](https://www.mongodb.com/cloud/atlas)
2. Go to **Deployments** → Your Cluster
3. Click **Browse Collections**
4. - [ ] See database: `freecall`
5. - [ ] Database is empty initially (collections created on first write)

#### Check Connection String
1. Go to **Cluster** → **Connect**
2. Select **Connect your application**
3. - [ ] Copy connection string again
4. - [ ] Format matches your `.env` file

#### Check Database User
1. Go to **Database Access**
2. - [ ] User `freecall_user` (or your username) exists
3. - [ ] Role is set correctly

#### Check Network Access
1. Go to **Network Access**
2. - [ ] Your IP is whitelisted (green checkmark)
3. - [ ] Or `0.0.0.0/0` is whitelisted

---

## Advanced Verification

### Query Logging (Development Mode)
When `NODE_ENV=development`, queries should be logged:

```
🔍 DB Query: users.findOne
   Query: { "_id": ObjectId("...") }
```

- [ ] In development, see query logs when making API requests
- [ ] Queries show collection name and operation

### Connection Events
Should see during startup:

```
📡 MongoDB connection: Connecting...
📡 MongoDB connection: Open
```

- [ ] See "Connecting" message
- [ ] See "Open" message within 5 seconds
- [ ] No "Disconnected" or "Error" messages

### Graceful Shutdown
Test with `Ctrl+C`:

```
^C
👋 Shutting down gracefully...
✓ MongoDB connection closed gracefully
```

- [ ] See shutdown message
- [ ] Connection closes without errors
- [ ] No hanging processes

---

## Common Issues - Quick Fixes

### ❌ Error: "MongoDB URI not provided"
- [ ] Check `.env` file exists in `backend/` directory
- [ ] Verify `MONGODB_ATLAS_URI=` has a value
- [ ] No spaces around `=` sign
- [ ] Restart server after editing `.env`

### ❌ Error: "Authentication failed"
- [ ] Verify username in connection string matches Atlas user
- [ ] Verify password in connection string matches
- [ ] Check for special characters → URL-encode them
- [ ] Create new database user if password lost

### ❌ Error: "ECONNREFUSED" or timeout
- [ ] Check MongoDB Atlas cluster is **Active**
- [ ] Verify IP is whitelisted in Network Access
- [ ] Try `0.0.0.0/0` temporarily for testing
- [ ] Check internet connection
- [ ] Verify correct cluster name in connection string

### ❌ Server starts but no DB logs
- [ ] Check `NODE_ENV=development` in `.env`
- [ ] Verify `connectDB()` is awaited in server.js
- [ ] Look for database connection errors in output

---

## Performance Baseline

### Connection Time
- [ ] Database connects within 5 seconds
- [ ] Server starts within 10 seconds total
- [ ] No timeout errors

### Query Performance
- [ ] Single document queries: < 50ms
- [ ] List queries: < 200ms
- [ ] Complex queries: < 500ms

(Note: Free tier (M0) is slower; paid tiers are faster)

---

## Documentation Review

- [ ] Read [SECURITY.md](./SECURITY.md)
  - [ ] Understand rate limiting
  - [ ] Know password requirements
  - [ ] Review environment variables
  
- [ ] Read [MONGODB_SETUP.md](./MONGODB_SETUP.md)
  - [ ] Understand MongoDB Atlas features
  - [ ] Know production best practices
  - [ ] Review backup strategy

- [ ] Read [GETTING_STARTED.md](./GETTING_STARTED.md)
  - [ ] Understand available API endpoints
  - [ ] Know how to run development server

---

## Final Verification

### Complete All Checks
- [ ] 1. Pre-Setup completed
- [ ] 2. MongoDB Atlas setup verified
- [ ] 3. Local setup configured
- [ ] 4. File structure confirmed
- [ ] 5. Code verification passed
- [ ] 6. Runtime test successful
- [ ] 7. MongoDB verified
- [ ] 8. No common issues encountered
- [ ] 9. Performance baseline acceptable
- [ ] 10. Documentation reviewed

### Success Indicators
✅ If all checked:
- MongoDB Atlas cluster is active and connected
- Backend server is running on port 5000
- Health endpoint returns OK status
- No connection errors in console
- Environment variables are properly set
- Ready to develop!

---

## Next Steps

Once verified, you can:

1. **Create test data**
   ```bash
   # Via API endpoint (you'll implement)
   POST /api/auth/register
   ```

2. **Connect frontend**
   - Update `CORS_ORIGIN` in backend `.env`
   - Update API URL in frontend `.env`

3. **Implement features**
   - User authentication
   - Real-time messaging
   - Video/voice calls

4. **Deploy to production**
   - See [SECURITY.md](./SECURITY.md) deployment section

---

## Rollback Instructions

If something goes wrong:

```bash
# 1. Stop server
Ctrl+C

# 2. Restore from backup
cp .env.template .env

# 3. Verify connection string again
# 4. Restart
npm start
```

---

**All checks passed? Your MongoDB connection is ready!** 🎉

For additional help, see:
- [MONGODB_SETUP.md#troubleshooting](./MONGODB_SETUP.md#troubleshooting)
- [MONGODB_QUICK_START.md](./MONGODB_QUICK_START.md)


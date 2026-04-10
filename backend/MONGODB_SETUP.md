# MongoDB Atlas Setup Guide

This guide walks you through setting up MongoDB Atlas (cloud MongoDB) for the FreeCall application.

## Table of Contents
1. [Create MongoDB Atlas Account](#1-create-mongodb-atlas-account)
2. [Create a Cluster](#2-create-a-cluster)
3. [Get Connection String](#3-get-connection-string)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Test Connection](#5-test-connection)
6. [Troubleshooting](#troubleshooting)

---

## 1. Create MongoDB Atlas Account

### Step 1.1: Go to MongoDB Atlas
Visit [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

### Step 1.2: Sign Up
- Click **"Sign Up"** or **"Start Free"**
- Choose **"Email"** as signup method
- Fill in:
  - Email address
  - Password (strong password recommended)
  - First name
  - Last name
- Accept terms and click **"Sign Up"**

### Step 1.3: Verify Email
- Check your email inbox for MongoDB verification link
- Click the verification link
- Complete organization setup (if prompted)

---

## 2. Create a Cluster

### Step 2.1: Create Your First Cluster
After signing up, you'll see a setup wizard:

**Option A: Using the Wizard (Recommended)**
1. Click **"Create a Deployment"**
2. Select **"M0 Free"** tier (good for development)
3. Select your cloud provider:
   - **AWS** (recommended, most stable)
   - **Azure**
   - **Google Cloud**
4. Choose the closest region to your location
5. Click **"Create Deployment"**

**Option B: Manual Setup**
1. Go to **Deployments** in the left sidebar
2. Click **"Create"**
3. Choose deployment type: **"Replica Set"** or **"Serverless"** (choose Replica Set)
4. Select **"M0 Free"** tier
5. Follow the same region selection as above
6. Click **"Create Project"**

### Step 2.2: Wait for Cluster Creation
- This takes 1-3 minutes
- You'll see a "Provisioning" status
- Wait until it shows "Active" (green)

---

## 3. Get Connection String

### Step 3.1: Navigate to Cluster
1. In the left sidebar, go to **"Deployments"**
2. You should see your cluster listed (e.g., "Cluster0")
3. Click on your cluster name

### Step 3.2: Configure Security (IP Whitelist)

**Important**: MongoDB requires whitelisting IP addresses for security.

#### For Development (Local Machine):
1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development only)
   - **Note**: This is NOT secure for production. In production, whitelist specific IPs.
4. Click **"Confirm"**

#### For Production (Recommended):
1. Whitelist your specific server's IP address
2. Or use VPC peering for enhanced security

### Step 3.3: Create Database User
1. Click **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Fill in:
   - **Username**: `freecall_user` (or your choice)
   - **Password**: Generate secure password (MongoDB will auto-generate one)
   - **Built-in Role**: Select **"Read and write to any database"**
4. Click **"Add User"**
5. **SAVE your username and password somewhere safe!**

### Step 3.4: Get Connection String
1. Go back to **"Deployments"** > Click on your cluster
2. Click the **"Connect"** button
3. Select **"Connect your application"**
4. Choose:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 4. Configure Environment Variables

### Step 4.1: Create .env File
1. In the `backend/` directory, create a `.env` file
2. Copy the connection string from Step 3.4

### Step 4.2: Fill in the .env File

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_ATLAS_URI=mongodb+srv://freecall_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/freecall?retryWrites=true&w=majority

# Alternative (if using local MongoDB)
MONGODB_URI=mongodb://localhost:27017/freecall

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_change_in_production
REFRESH_TOKEN_EXPIRE=30d

# Other configurations...
```

### Step 4.3: Replace Placeholders
In your connection string, replace:
- `<username>` → Username you created (e.g., `freecall_user`)
- `<password>` → Password you created (URL-encoded if it contains special characters)
- `<dbname>` → Database name (e.g., `freecall`)
- `cluster0.xxxxx` → Your cluster name from MongoDB Atlas

### Step 4.4: Handle Special Characters in Password
If your password contains special characters like `@`, `#`, `$`, `:`, etc., **URL-encode them**:

**Common encodings**:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `:` → `%3A`
- `!` → `%21`

**Example**:
```
Password: my password@123#
URL-encoded: my%20password%40123%23

Connection string: 
mongodb+srv://freecall_user:my%20password%40123%23@cluster0.xxxxx.mongodb.net/freecall
```

---

## 5. Test Connection

### Step 5.1: Run the Server

```bash
cd backend
npm install  # Install dependencies if not done yet
npm start    # Start the server
```

### Step 5.2: Check Logs

You should see output like:

```
✓ MongoDB connected successfully
  Database: freecall
  Host: cluster0.xxxxx.mongodb.net
  Environment: development

🚀 Server running on http://localhost:5000
📡 WebSocket ready for connections
🔄 Environment: development
```

### Step 5.3: Test Connection in Browser

1. Open your browser
2. Go to `http://localhost:5000/api/health`
3. You should see:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-04-10T12:00:00.000Z"
   }
   ```

### Step 5.4: Verify Database

In MongoDB Atlas:
1. Go to **Deployments** > Your Cluster
2. Click **"Browse Collections"**
3. You should see your database `freecall` listed
4. After running the app, you'll see collections like `users`, `conversations`, etc.

---

## 6. Database Configuration Details

### Connection String Anatomy

```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
           ↑         ↑        ↑  ↑      ↑                 ↑         ↑
         Protocol  User    Pass Host Domain            Database  Options
```

### Connection Options Explained

In `src/config/db.js`, we use these options:

| Option | Value | Purpose |
|--------|-------|---------|
| `useNewUrlParser` | `true` | Uses new MongoDB URL parser |
| `useUnifiedTopology` | `true` | Uses new connection management |
| `serverSelectionTimeoutMS` | `5000` | Timeout after 5 seconds if can't connect |
| `socketTimeoutMS` | `45000` | Close idle connections after 45 seconds |
| `family` | `4` | Use IPv4 (more compatible) |

### Mongoose Query Logging (Development)

When `NODE_ENV=development`, Mongoose logs all database queries:

```
🔍 DB Query: users.findOne
   Query: { "_id": ObjectId("...") }
```

To disable this, set `NODE_ENV=production`.

---

## 7. Troubleshooting

### Issue: "MongoDB connection failed"

**Problem**: Server fails to connect to MongoDB

**Solutions**:

1. **Check Environment Variables**
   ```bash
   # Verify .env file exists and has correct URI
   cat .env | grep MONGODB
   ```

2. **Verify IP Whitelist**
   - Go to MongoDB Atlas → **Network Access**
   - Check if your IP is whitelisted
   - Try "Allow Access from Anywhere" for testing (not production)

3. **Check Username/Password**
   - Go to MongoDB Atlas → **Database Access**
   - Verify username and password haven't changed
   - Recreate user if needed

4. **Test Connection String Locally**
   ```bash
   mongosh "your-connection-string"
   ```

### Issue: "URI format is invalid"

**Problem**: Connection string format is wrong

**Solution**:
1. Copy the string directly from MongoDB Atlas (don't modify it)
2. Replace only `<username>`, `<password>`, and `<dbname>`
3. Don't add extra characters

### Issue: "Too many connections"

**Problem**: "MongoNetworkError: too many connections"

**Solution**:
1. Check if multiple server instances are running
2. Restart the server: `Ctrl+C` then `npm start`
3. Clear MongoDB connection pools: wait 1 minute

### Issue: "Authentication failed"

**Problem**: "MongoAuthenticationError: authentication failed"

**Solution**:
1. Verify database user exists (Database Access in Atlas)
2. Check username and password match exactly
3. Ensure database name in connection string exists
4. URL-encode special characters in password

### Issue: "Connection timeout"

**Problem**: "MongoServerSelectionError: connect ECONNREFUSED"

**Solution**:
1. Check internet connection
2. Verify MongoDB Atlas cluster is running (status should be "Active")
3. Check firewall settings
4. Try connecting from different network
5. Increase timeout in `db.js`: change `serverSelectionTimeoutMS` to `10000`

---

## 8. Best Practices

### Development
✅ Use MongoDB Atlas free tier (M0)
✅ Allow all IPs for testing (`0.0.0.0/0`)
✅ Keep `.env` file with dummy values in `.env.example`
✅ Enable query logging for debugging

### Production
✅ Use at least M2 or higher tier
✅ Whitelist specific IP addresses only
✅ Enable authentication for all users
✅ Enable backups and point-in-time recovery
✅ Use VPC peering or private endpoints
✅ Enable encryption at rest
✅ Set up monitoring and alerts
✅ Regularly backup data
✅ Disable debug logging (`NODE_ENV=production`)

### Security Checklist
- [ ] Changed default username/password
- [ ] Whitelisted specific IPs (not `0.0.0.0/0`)
- [ ] Enabled backups
- [ ] Set up monitoring
- [ ] Enabled SSL/TLS
- [ ] Created separate users for different apps
- [ ] Enabled encryption at rest
- [ ] Set up alerts for unusual activity

---

## 9. Useful MongoDB Atlas Features

### Collections
View your data in real-time:
1. **Deployments** → Your Cluster
2. **Collections** tab
3. Browse documents, run queries

### Backups
Automatic backups included:
1. **Backup** section in left sidebar
2. Restores available for last 7 days (free tier)

### Monitoring
Monitor performance:
1. **Metrics** section
2. View operations/second, network throughput, CPU

### Query Analyzer
Optimize slow queries:
1. **Profiler** section
2. View and analyze slow queries

---

## 10. Useful Commands

### Connect Locally (if local MongoDB installed)
```bash
# Using mongosh (new shell)
mongosh "mongodb://localhost:27017/freecall"

# Using mongo (legacy shell, if installed)
mongo mongodb://localhost:27017/freecall
```

### Test Atlas Connection
```bash
# Using mongosh
mongosh "mongodb+srv://username:password@cluster.mongodb.net/freecall"
```

### Check Connection Status in Node.js
```bash
npm start
# Look for logs:
# ✓ MongoDB connected successfully
```

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB URI Connection String](https://docs.mongodb.com/manual/reference/connection-string/)
- [Mongoose Connection Guide](https://mongoosejs.com/docs/connections.html)
- [MongoDB Pricing](https://www.mongodb.com/pricing)
- [FreeCall SECURITY.md](./SECURITY.md) - Security best practices

---

## Summary

1. ✅ Create MongoDB Atlas account
2. ✅ Create M0 free cluster
3. ✅ Add your IP to whitelist
4. ✅ Create database user
5. ✅ Copy connection string
6. ✅ Update `.env` file with `MONGODB_ATLAS_URI`
7. ✅ Run `npm start` and verify connection
8. ✅ Use `Browse Collections` to verify data

Your backend is now connected to MongoDB Atlas! 🎉


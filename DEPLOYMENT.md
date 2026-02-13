# 🚀 Deployment Guide - Render Platform

This guide will walk you through deploying the Lab Inventory Management System on Render.

---

## Prerequisites

1. ✅ GitHub account
2. ✅ Render account (free tier available at https://render.com)
3. ✅ MongoDB Atlas account (free tier available at https://mongodb.com/cloud/atlas)

---

## Step 1: Setup MongoDB Atlas Database

### 1.1 Create MongoDB Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Click **"Build a Database"**
4. Select **"M0 FREE"** tier
5. Choose your cloud provider and region
6. Click **"Create Cluster"**

### 1.2 Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `labinventory`
5. Password: Generate a strong password (save it!)
6. Database User Privileges: **"Atlas admin"**
7. Click **"Add User"**

### 1.3 Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **"Database"** (Deployments → Database)
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` with your database username
6. Replace `<password>` with your database password
7. Add database name after `.net/`:
   ```
   mongodb+srv://labinventory:yourpassword@cluster0.xxxxx.mongodb.net/lab-inventory?retryWrites=true&w=majority
   ```

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git Repository

```bash
cd lab-inventory-system
git init
git add .
git commit -m "Initial commit - Lab Inventory System"
```

### 2.2 Create GitHub Repository

1. Go to https://github.com
2. Click **"New repository"**
3. Name: `lab-inventory-system`
4. Visibility: Public or Private
5. **Don't** initialize with README (we already have one)
6. Click **"Create repository"**

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/lab-inventory-system.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy on Render

### 3.1 Create New Web Service

1. Go to https://dashboard.render.com
2. Sign up or log in (you can use your GitHub account)
3. Click **"New +"** button
4. Select **"Web Service"**

### 3.2 Connect Repository

1. Click **"Connect account"** to link GitHub (if not already connected)
2. Grant Render access to your repositories
3. Find and select `lab-inventory-system`
4. Click **"Connect"**

### 3.3 Configure Service

Fill in the following details:

**Basic Settings:**
- **Name:** `lab-inventory-system` (or your preferred name)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** (leave blank)
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- Select **"Free"** (or paid tier for better performance)

### 3.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | Your MongoDB connection string from Step 1.4 |
| `JWT_SECRET` | Generate a strong random string (min 32 chars)* |
| `JWT_EXPIRE` | `7d` |
| `ADMIN_EMAIL` | `admin@hospital.com` |
| `ADMIN_PASSWORD` | `Admin@123` (change after first login!) |

*To generate a strong JWT_SECRET, use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.5 Create Web Service

1. Click **"Create Web Service"**
2. Wait for deployment (usually 2-5 minutes)
3. Watch the build logs for any errors

---

## Step 4: Access Your Application

Once deployment is complete:

1. Your app URL will be: `https://lab-inventory-system.onrender.com` (or your custom name)
2. Click the URL to open your application
3. You should see the login screen

### Default Admin Login

```
Email: admin@hospital.com
Password: Admin@123
```

**⚠️ IMPORTANT:** 
- Change the admin password immediately after first login!
- You can do this from the dashboard → Update Password

---

## Step 5: Post-Deployment Configuration

### 5.1 Verify Everything Works

1. ✅ Login with admin credentials
2. ✅ Create a test user
3. ✅ Add a test inventory item
4. ✅ Submit a test request
5. ✅ Check audit logs
6. ✅ Export a test report

### 5.2 Update Admin Password

1. Login as admin
2. Go to profile settings
3. Update password to something secure

### 5.3 Create Staff Users

1. Navigate to **Users** section
2. Click **"Add User"**
3. Fill in staff details
4. Assign appropriate department
5. Share credentials securely with staff

---

## 🔧 Troubleshooting

### Issue: "Application Failed to Deploy"

**Solution:**
1. Check build logs in Render dashboard
2. Verify all environment variables are set correctly
3. Ensure MongoDB connection string is correct
4. Check if MongoDB IP whitelist includes 0.0.0.0/0

### Issue: "Cannot Connect to Database"

**Solution:**
1. Verify MongoDB connection string format
2. Check database user credentials
3. Ensure network access is set to 0.0.0.0/0
4. Test connection string locally first

### Issue: "Admin User Not Created"

**Solution:**
1. Check application logs in Render
2. Verify ADMIN_EMAIL and ADMIN_PASSWORD environment variables
3. Trigger a manual restart in Render dashboard

### Issue: "Application Loading Slowly"

**Solution:**
- Free tier on Render spins down after inactivity
- First request after inactivity takes 30-60 seconds
- Consider upgrading to paid tier for always-on service

---

## 🔄 Updating Your Application

### Method 1: Automatic Deployment (Recommended)

Render automatically deploys when you push to GitHub:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin main

# Render will automatically detect and deploy
```

### Method 2: Manual Deployment

1. Go to Render dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 Monitoring

### View Application Logs

1. Go to Render dashboard
2. Select your service
3. Click **"Logs"** tab
4. View real-time logs

### Monitor Performance

1. Check **"Metrics"** tab for:
   - CPU usage
   - Memory usage
   - Request rates
   - Response times

### Set Up Notifications

1. Go to service settings
2. Configure email notifications for:
   - Deployment failures
   - Service crashes
   - High resource usage

---

## 🔒 Security Best Practices

1. ✅ Change default admin password immediately
2. ✅ Use strong JWT_SECRET (min 32 characters)
3. ✅ Regularly update dependencies: `npm audit fix`
4. ✅ Enable 2FA on your Render and MongoDB accounts
5. ✅ Regularly review audit logs
6. ✅ Keep MongoDB credentials secure
7. ✅ Don't commit `.env` file to GitHub

---

## 💰 Render Pricing

### Free Tier
- ✅ 750 hours/month (enough for 1 service)
- ✅ Automatic SSL certificates
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ 512 MB RAM
- ⚠️ Shared CPU

### Paid Tiers (Starter - $7/month)
- ✅ Always-on (no spin down)
- ✅ 512 MB RAM
- ✅ Shared CPU
- ✅ Better performance

For production use, consider upgrading to a paid tier.

---

## 🎯 Next Steps

1. ✅ Configure staff user accounts
2. ✅ Import initial inventory data
3. ✅ Train staff on system usage
4. ✅ Set up regular backup schedule
5. ✅ Monitor system usage and performance
6. ✅ Gather user feedback for improvements

---

## 📧 Support

If you encounter issues:

1. Check application logs in Render
2. Review MongoDB Atlas logs
3. Consult the main README.md
4. Check Render documentation: https://render.com/docs

---

## ✅ Deployment Checklist

Before going live:

- [ ] MongoDB database created and configured
- [ ] GitHub repository created and code pushed
- [ ] Render service created and deployed
- [ ] All environment variables set correctly
- [ ] Admin login successful
- [ ] Admin password changed
- [ ] Test user created and can login
- [ ] Test inventory item added
- [ ] Test request submitted and approved
- [ ] Audit logs working
- [ ] Reports can be exported
- [ ] SSL certificate active (automatic on Render)
- [ ] Custom domain configured (optional)

---

**Congratulations! Your Lab Inventory Management System is now live! 🎉**

Access it at: `https://your-service-name.onrender.com`

# ⚡ Quick Start Guide

Get your Lab Inventory Management System running in 5 minutes!

---

## 🚀 Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lab-inventory
JWT_SECRET=my-super-secret-jwt-key-change-in-production-12345678
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=Admin@123
```

### 3. Start MongoDB

Make sure MongoDB is running locally:

```bash
# Using MongoDB service
sudo service mongod start

# OR using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start the Server

```bash
npm start
```

### 5. Open Application

Open your browser and go to: `http://localhost:3000`

**Default Login:**
- Email: `admin@hospital.com`
- Password: `Admin@123`

---

## 🌐 Production Deployment (Render)

### Quick Deploy Button

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deployment

1. **Setup MongoDB Atlas** (Free tier)
   - Go to https://mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/lab-inventory.git
   git push -u origin main
   ```

3. **Deploy on Render**
   - Go to https://render.com
   - New Web Service
   - Connect GitHub repo
   - Add environment variables
   - Deploy!

**Detailed instructions:** See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📁 Project Structure

```
lab-inventory-system/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env.example          # Environment template
├── README.md             # Full documentation
├── DEPLOYMENT.md         # Deployment guide
│
├── models/               # Database models
│   ├── User.js
│   ├── Inventory.js
│   ├── Request.js
│   └── AuditLog.js
│
├── routes/               # API routes
│   ├── auth.js
│   ├── users.js
│   ├── inventory.js
│   ├── requests.js
│   ├── audit.js
│   └── reports.js
│
├── middleware/           # Custom middleware
│   └── auth.js
│
├── utils/               # Utility functions
│   └── auditLog.js
│
└── public/              # Frontend files
    ├── index.html       # Main HTML
    ├── css/
    │   └── style.css    # Styles
    └── js/
        └── app.js       # Frontend logic
```

---

## 🎯 Core Features Overview

### For Admins

1. **User Management**
   - Create staff accounts
   - Assign departments
   - Activate/deactivate users

2. **Inventory Control**
   - Add/edit/delete items
   - Track stock levels
   - Monitor low stock alerts

3. **Approval Workflow**
   - Review requests
   - Approve/partially approve/reject
   - Adjust quantities

4. **Reporting & Audit**
   - Export PDF/Excel reports
   - View complete audit logs
   - Track all system activities

### For Staff

1. **View Inventory**
   - See department items
   - Check availability
   - View item details

2. **Submit Requests**
   - Request commodities
   - Specify quantities
   - Add justification

3. **Track Status**
   - Monitor approvals
   - View history
   - Get notifications

---

## 🔑 API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password

### Inventory
- `GET /api/inventory` - List items
- `POST /api/inventory` - Add item (Admin)
- `PUT /api/inventory/:id` - Update item (Admin)
- `DELETE /api/inventory/:id` - Delete item (Admin)

### Requests
- `GET /api/requests` - List requests
- `POST /api/requests` - Create request
- `PUT /api/requests/:id/review` - Review (Admin)

### Users (Admin Only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Reports (Admin Only)
- `GET /api/reports/inventory/pdf` - Inventory PDF
- `GET /api/reports/inventory/excel` - Inventory Excel
- `GET /api/reports/requests/excel` - Requests Excel
- `GET /api/reports/audit/excel` - Audit Excel

---

## 🐛 Common Issues & Solutions

### Issue: Cannot connect to MongoDB

**Solution:**
```bash
# Check if MongoDB is running
sudo service mongod status

# Start MongoDB
sudo service mongod start

# Or use MongoDB Atlas (cloud)
```

### Issue: Port 3000 already in use

**Solution:**
Change PORT in `.env`:
```env
PORT=8080
```

### Issue: JWT token invalid

**Solution:**
- Clear localStorage in browser
- Logout and login again
- Check JWT_SECRET in .env

---

## 📚 Learn More

- **Full Documentation:** [README.md](README.md)
- **Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Docs:** Coming soon
- **Video Tutorial:** Coming soon

---

## 🆘 Need Help?

1. Check the logs:
   ```bash
   # View server logs
   npm start
   
   # Check for errors
   ```

2. Verify environment variables:
   ```bash
   cat .env
   ```

3. Test database connection:
   ```bash
   # Using mongo shell
   mongo
   show dbs
   ```

---

## ✅ First-Time Setup Checklist

- [ ] Node.js installed (v18+)
- [ ] MongoDB running (local or Atlas)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created
- [ ] Server started successfully
- [ ] Can access http://localhost:3000
- [ ] Admin login works
- [ ] Test user created
- [ ] Test inventory item added
- [ ] Test request submitted

---

## 🚀 You're Ready!

Your Lab Inventory Management System is set up and ready to use!

**Next Steps:**
1. Change admin password
2. Create staff users
3. Add inventory items
4. Train staff on system
5. Start tracking inventory!

**Happy managing! 🧪**

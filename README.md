# 🧪 Lab Inventory Management System

A hospital-grade, role-based **Lab Inventory Management System** designed to digitize laboratory stock control, approvals, and accountability.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-ISC-yellow)

---

## 🚀 Features

### 🔐 **Authentication & Security**
- JWT-based authentication
- Role-based access control (Admin / Staff)
- Password encryption with bcrypt
- Secure API endpoints

### 👥 **Role Management**

#### Admin Capabilities:
- ✅ Create, update, and deactivate staff accounts
- ✅ Review and approve/reject inventory requests
- ✅ Adjust approved quantities (partial approval)
- ✅ System-wide inventory visibility
- ✅ Access audit logs
- ✅ Export reports (PDF & Excel)
- ✅ Manage departments and permissions
- ✅ Low-stock alert monitoring

#### Staff Capabilities:
- ✅ View department-specific inventory
- ✅ Submit commodity requests
- ✅ Track request approval status
- ✅ View request history

### 📦 **Inventory Management**
- Add, update, and track lab commodities
- Department-level inventory visibility
- Automatic low-stock alerts
- Support for multiple categories: Reagents, Equipment, Consumables, Chemicals, Glassware
- Detailed item tracking: batch numbers, expiry dates, suppliers, costs

### ✅ **Approval Workflow**
- Staff submit requests with justification
- Admin reviews with ability to:
  - Approve full quantity
  - Partially approve (adjust quantity)
  - Reject with reason
- Real-time inventory adjustment upon approval
- Email notifications (optional)

### 📜 **Audit Logs**
- Complete activity tracking
- Records all system actions:
  - User logins
  - Inventory changes
  - Request approvals/rejections
  - User management actions
- Tamper-proof design
- Searchable and filterable

### 📄 **Reporting**
- **Inventory Reports** (PDF & Excel)
- **Request Reports** (Excel)
- **Audit Log Reports** (Excel)
- Real-time data export
- Professional formatting

### 🎨 **Modern UI/UX**
- Hospital-themed design
- Pill-shaped buttons
- Responsive layout
- Real-time updates
- Toast notifications
- Modal dialogs

---

## 🛠️ Technology Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation
- **ExcelJS** - Excel generation

### Frontend
- **Vanilla JavaScript** - No frameworks for simplicity
- **HTML5** & **CSS3**
- **Google Fonts** (Poppins, Outfit)
- Responsive design

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lab-inventory-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lab-inventory?retryWrites=true&w=majority

# JWT Secret (Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# JWT Expiration
JWT_EXPIRE=7d

# Admin Setup
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=Admin@123

# Email Configuration (Optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@labinventory.com
```

### 4. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The application will be available at: `http://localhost:3000`

---

## 🌐 Deployment on Render

### Step 1: Create MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string
5. Whitelist all IPs (0.0.0.0/0) for Render

### Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** lab-inventory-system
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### Step 4: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
PORT=3000
NODE_ENV=production
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<generate-strong-random-string>
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=Admin@123
```

### Step 5: Deploy

Click **"Create Web Service"** and wait for deployment to complete.

Your app will be live at: `https://your-app-name.onrender.com`

---

## 👤 Default Admin Account

After first deployment, a default admin account is created:

- **Email:** `admin@hospital.com`
- **Password:** `Admin@123`

**⚠️ IMPORTANT:** Change the password immediately after first login!

---

## 📖 User Guide

### Admin Workflow

1. **Login** with admin credentials
2. **Add Users** → Create staff accounts for each department
3. **Add Inventory Items** → Stock lab commodities
4. **Review Requests** → Approve/reject/partially approve staff requests
5. **Monitor** → Check low stock alerts and audit logs
6. **Export Reports** → Generate PDF/Excel reports

### Staff Workflow

1. **Login** with staff credentials
2. **View Inventory** → See available items in your department
3. **Submit Request** → Request needed commodities with justification
4. **Track Status** → Monitor approval status
5. **Receive Items** → After admin approval

---

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Input validation
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Audit logging

---

## 📊 Database Schema

### Collections

1. **Users** - Staff and admin accounts
2. **Inventory** - Lab commodities
3. **Requests** - Commodity requests with approval workflow
4. **AuditLogs** - Complete system activity tracking

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check MongoDB URI format
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Ensure IP whitelist includes 0.0.0.0/0
```

### Port Already in Use

```bash
# Change PORT in .env file
PORT=8080
```

### Admin Not Created

```bash
# Check server logs for errors
# Verify ADMIN_EMAIL and ADMIN_PASSWORD in .env
# Restart the server
```

---

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password

### Users (Admin)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Add item (Admin)
- `GET /api/inventory/:id` - Get item details
- `PUT /api/inventory/:id` - Update item (Admin)
- `DELETE /api/inventory/:id` - Delete item (Admin)
- `GET /api/inventory/stats/dashboard` - Get stats

### Requests
- `GET /api/requests` - Get requests
- `POST /api/requests` - Create request
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id/review` - Review request (Admin)
- `GET /api/requests/stats/dashboard` - Get stats

### Audit Logs (Admin)
- `GET /api/audit` - Get audit logs
- `GET /api/audit/user/:userId` - Get user logs
- `GET /api/audit/stats` - Get stats

### Reports (Admin)
- `GET /api/reports/inventory/pdf` - Export inventory PDF
- `GET /api/reports/inventory/excel` - Export inventory Excel
- `GET /api/reports/requests/excel` - Export requests Excel
- `GET /api/reports/audit/excel` - Export audit logs Excel

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 📧 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@labinventory.com

---

## 🎯 Roadmap

### Phase 2 Features (Planned)
- [ ] Email notifications
- [ ] SMS alerts for critical low stock
- [ ] Barcode scanning
- [ ] Advanced analytics dashboard
- [ ] Multi-location support
- [ ] Automated reorder system
- [ ] Equipment maintenance tracking
- [ ] Mobile app (React Native)

---

## 🙏 Acknowledgments

- Icons from Unicode Emoji
- Fonts from Google Fonts
- UI inspiration from modern hospital management systems

---

**Built with ❤️ for hospital laboratories**

🧪 **LabInventory** - Digitizing Laboratory Management

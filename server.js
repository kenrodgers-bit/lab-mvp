require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');
const requestRoutes = require('./routes/requests');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for frontend
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  initializeAdmin();
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// Initialize default admin user
async function initializeAdmin() {
  const User = require('./models/User');
  try {
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@hospital.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'System Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@hospital.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin',
        department: 'Administration',
        isActive: true
      });
      await admin.save();
      console.log('✅ Default admin user created');
      console.log('Email:', process.env.ADMIN_EMAIL || 'admin@hospital.com');
      console.log('Password:', process.env.ADMIN_PASSWORD || 'Admin@123');
    }
  } catch (error) {
    console.error('Error creating admin:', error.message);
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

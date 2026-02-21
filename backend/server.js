require('dotenv').config();

// ─── ENV Debug (remove in production) ────────────────────────────────────────
console.log('ENV CHECK:', {
  DB_MODE: process.env.DB_MODE,
  MONGO_URI_LOCAL: process.env.MONGO_URI_LOCAL,
  MONGO_URI_ATLAS: process.env.MONGO_URI_ATLAS,
});

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const employeeAuthRoutes = require('./routes/employeeAuth');

const app = express();

// ─── Database Selection ───────────────────────────────────────────────────────
const DB_MODE = process.env.DB_MODE || 'local';
const MONGO_URI = DB_MODE === 'atlas'
  ? process.env.MONGO_URI_ATLAS
  : process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/ai-hrms';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is undefined. Check your .env file.');
  process.exit(1);
}

console.log(`🗄️  DB Mode: ${DB_MODE}`);
console.log(`📡 Connecting to: ${MONGO_URI}`);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/employee-auth', employeeAuthRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'OK',
  dbMode: DB_MODE,
  timestamp: new Date().toISOString()
}));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// ─── Database Connection & Server Start ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`✅ MongoDB Connected (${DB_MODE})`);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
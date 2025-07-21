const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('./config/passport');
const connectDB = require('./config/db');

// Load environment variables
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:19000',
    'http://localhost:19006',
    'exp://localhost:19000',
    'https://watch-production-98bb.up.railway.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { admin } = require('./config/firebase');
    const dbStatus = admin.app().name ? 'connected' : 'not connected';
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      firebase: dbStatus,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Server is running but Firebase is not connected',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

// Mount all routes under /api
const router = require('./routes/index');
app.use('/api', (req, res, next) => {
  console.log('Server: API request:', req.method, req.originalUrl);
  next();
}, router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server after DB connection
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
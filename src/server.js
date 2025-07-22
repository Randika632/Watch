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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));

// Mount all routes under /api
const router = require('./routes/index');
app.use('/api', (req, res, next) => {
  console.log('Server: API request:', req.method, req.originalUrl);
  next();
}, router);

// Start server after DB connection
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
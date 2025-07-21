const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Safe Track backend is running!' });
});

// Mount auth router at /auth
router.use('/auth', (req, res, next) => {
  console.log('Main router: Auth route hit:', req.method, req.path);
  next();
}, require('./auth'));

// Mount user router at /users
router.use('/users', require('./user'));

// Mount reports router at /reports
router.use('/reports', require('./report'));

// Mount ESP32 router at /esp32
router.use('/esp32', require('./esp32'));

// TODO: router.use('/health', require('./health'));
// TODO: router.use('/location', require('./location'));

module.exports = router; 
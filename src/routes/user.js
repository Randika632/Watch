const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// Test route to verify router mounting
router.get('/test', (req, res) => {
  res.json({ message: 'User route is working!' });
});

module.exports = router; 
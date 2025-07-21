const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// Get user profile
router.get('/', auth, profileController.getProfile);

// Update user profile (including image URL)
router.put('/', auth, profileController.updateProfile);

module.exports = router; 
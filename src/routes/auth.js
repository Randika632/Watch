const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// Debug: Log available profile controller methods
console.log('Profile controller methods:', Object.keys(profileController));

// Register & login routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Test route (no auth required)
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working!', timestamp: new Date().toISOString() });
});

// Get current user
router.get('/me', auth, authController.getCurrentUser);

// Profile routes under /api/auth/profile
router.get('/profile', auth, (req, res, next) => {
  console.log('Auth route: /profile hit');
  profileController.getProfile(req, res, next);
});
router.put('/profile', auth, profileController.updateProfile);
router.post('/profile/image', auth, profileController.uploadProfileImage);
router.get('/profile/stats', auth, (req, res, next) => {
  console.log('Auth route: /profile/stats hit');
  profileController.getUserStats(req, res, next);
});
router.get('/profile/activity', auth, (req, res, next) => {
  console.log('Auth route: /profile/activity hit');
  profileController.getActivityHistory(req, res, next);
});

module.exports = router;

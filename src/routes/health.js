const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const auth = require('../middleware/auth');

router.get('/', auth, healthController.getHealth);

module.exports = router; 
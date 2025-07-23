const express = require('express');
const router = express.Router();
const esp32Controller = require('../controllers/esp32Controller');
const auth = require('../middleware/auth');

router.get('/', auth, esp32Controller.getHealth);
// Save a new measurement
router.post('/measurement', auth, esp32Controller.saveMeasurement);
// Get last 7 days of measurements, averaged per day
router.get('/report', auth, esp32Controller.getWeeklyReport);

module.exports = router; 
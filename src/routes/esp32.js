const express = require('express');
const router = express.Router();
const { 
  getLatestData, 
  getDataHistory, 
  getStatus,
  getHealthData,
  getCombinedData,
  getHeartbeatHistory,
  testFirebase,
  validateHeartRate,
  getAverageHeartRate,
  debugFirebaseData,
  getCurrentHealthData,
  getRawESP32Data,
  testESP32DataChange
} = require('../controllers/esp32Controller');

// GET /api/esp32/data - Get latest ESP32 data
router.get('/data', getLatestData);

// GET /api/esp32/history - Get ESP32 GPS data history
router.get('/history', getDataHistory);

// GET /api/esp32/status - Get ESP32 status
router.get('/status', getStatus);

// GET /api/esp32/health - Get heartbeat data
router.get('/health', getHealthData);

// GET /api/esp32/combined - Get combined GPS + Heartbeat data
router.get('/combined', getCombinedData);

// GET /api/esp32/heartbeat-history - Get heartbeat history
router.get('/heartbeat-history', getHeartbeatHistory);

// GET /api/esp32/heartbeat/validate - Validate heart rate measurement
router.get('/heartbeat/validate', validateHeartRate);

// GET /api/esp32/heartbeat/average - Get average heart rate over time period
router.get('/heartbeat/average', getAverageHeartRate);

// GET /api/esp32/debug - Debug Firebase data structure
router.get('/debug', debugFirebaseData);

// GET /api/esp32/health-data - Get current health data structure
router.get('/health-data', getCurrentHealthData);

// GET /api/esp32/raw-data - Get raw ESP32 data
router.get('/raw-data', getRawESP32Data);

// GET /api/esp32/test-change - Test if ESP32 data is changing
router.get('/test-change', testESP32DataChange);

// GET /api/esp32/test - Test Firebase connectivity
router.get('/test', testFirebase);

module.exports = router; 
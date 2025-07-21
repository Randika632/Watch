const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');
const responseController = require('../controllers/responseController');

// Report routes
router.post('/', auth, reportController.createReport);
router.get('/', reportController.getAllReports);
router.get('/active', reportController.getActiveReports);
router.get('/:id', reportController.getReport);
router.put('/:id', auth, reportController.updateReport);
router.delete('/:id', auth, reportController.deleteReport);

// Response routes for a specific report
router.post('/:reportId/responses', auth, responseController.createResponse);
router.get('/:reportId/responses', responseController.getReportResponses);
router.put('/responses/:responseId', auth, responseController.updateResponse);
router.delete('/responses/:responseId', auth, responseController.deleteResponse);

module.exports = router; 
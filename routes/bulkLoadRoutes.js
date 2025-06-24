const express = require('express');
const router = express.Router();
const BulkLoadController = require('../controllers/BulkLoadController');

// Route to download CSV template
router.get('/template', BulkLoadController.downloadTemplate);

// Route to upload employee data
router.post('/upload', BulkLoadController.uploadEmployees);

// Route to check upload status
router.get('/status/:batch_id', BulkLoadController.getUploadStatus);

module.exports = router;

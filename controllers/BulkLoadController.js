const BulkLoadService = require('../services/BulkLoadService');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const os = require('os');

// Configure multer for file upload
const upload = multer({
    dest: os.tmpdir(),
    fileFilter: (req, file, cb) => {
        // Accept only CSV files
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('file');

class BulkLoadController {
    async uploadEmployees(req, res) {
        try {
            // Handle file upload
            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: err.message
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'No file uploaded'
                    });
                }

                try {
                    // Process the uploaded file
                    const results = await BulkLoadService.processCSVFile(req.file.path);

                    // Clean up the temporary file
                    await fs.unlink(req.file.path);

                    // Return results
                    return res.status(200).json({
                        status: 'success',
                        data: {
                            successful_imports: results.success.length,
                            failed_imports: results.errors.length,
                            errors: results.errors
                        }
                    });
                } catch (error) {
                    // Clean up the temporary file in case of error
                    try {
                        await fs.unlink(req.file.path);
                    } catch (unlinkError) {
                        console.error('Error deleting temporary file:', unlinkError);
                    }

                    return res.status(500).json({
                        status: 'error',
                        message: 'Error processing file',
                        error: error.message
                    });
                }
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Server error',
                error: error.message
            });
        }
    }

    async downloadTemplate(req, res) {
        try {
            const template = await BulkLoadService.generateTemplateCSV();
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=employee_template.csv');
            
            return res.send(template);
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Error generating template',
                error: error.message
            });
        }
    }

    async getUploadStatus(req, res) {
        try {
            const { batch_id } = req.params;
            
            // TODO: Implement batch status tracking
            // This would be useful for large file uploads
            
            return res.status(200).json({
                status: 'success',
                data: {
                    batch_id,
                    status: 'completed',
                    processed: 0,
                    failed: 0
                }
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Error fetching status',
                error: error.message
            });
        }
    }
}

module.exports = new BulkLoadController();

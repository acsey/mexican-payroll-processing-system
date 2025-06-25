const express = require('express');
const router = express.Router();
const PayrollExportController = require('../controllers/PayrollExportController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Obtener períodos de nómina disponibles
router.get('/periods', PayrollExportController.getPayrollPeriods);

// Vista previa de datos de nómina
router.get('/preview/:periodId', PayrollExportController.getPayrollPreview);

// Exportar para dispersión bancaria (CSV)
router.get('/dispersion/:periodId', PayrollExportController.exportForDispersion);

// Exportar para PAC (XML)
router.get('/pac/:periodId', PayrollExportController.exportForPAC);

// Exportar resumen de nómina (CSV)
router.get('/summary/:periodId', PayrollExportController.exportPayrollSummary);

// Generar recibos de nómina (JSON)
router.get('/receipts/:periodId', PayrollExportController.generatePayrollReceipts);

module.exports = router;

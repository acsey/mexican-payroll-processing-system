const PayrollExportService = require('../services/PayrollExportService');

class PayrollExportController {
    
    // Obtener períodos de nómina disponibles
    async getPayrollPeriods(req, res) {
        try {
            const periods = await PayrollExportService.getAvailablePayrollPeriods();
            res.json({
                success: true,
                data: periods
            });
        } catch (error) {
            console.error('Error obteniendo períodos de nómina:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener períodos de nómina',
                error: error.message
            });
        }
    }

    // Exportar para dispersión bancaria
    async exportForDispersion(req, res) {
        try {
            const { periodId } = req.params;
            
            if (!periodId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del período es requerido'
                });
            }

            const exportData = await PayrollExportService.exportToCSVForDispersion(periodId);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
            res.send(exportData.content);
            
        } catch (error) {
            console.error('Error exportando para dispersión:', error);
            res.status(500).json({
                success: false,
                message: 'Error al exportar archivo de dispersión',
                error: error.message
            });
        }
    }

    // Exportar para PAC (XML)
    async exportForPAC(req, res) {
        try {
            const { periodId } = req.params;
            
            if (!periodId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del período es requerido'
                });
            }

            const exportData = await PayrollExportService.exportToXMLForPAC(periodId);
            
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
            res.send(exportData.content);
            
        } catch (error) {
            console.error('Error exportando para PAC:', error);
            res.status(500).json({
                success: false,
                message: 'Error al exportar archivo para PAC',
                error: error.message
            });
        }
    }

    // Exportar resumen de nómina
    async exportPayrollSummary(req, res) {
        try {
            const { periodId } = req.params;
            
            if (!periodId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del período es requerido'
                });
            }

            const exportData = await PayrollExportService.exportPayrollSummary(periodId);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
            res.send(exportData.content);
            
        } catch (error) {
            console.error('Error exportando resumen:', error);
            res.status(500).json({
                success: false,
                message: 'Error al exportar resumen de nómina',
                error: error.message
            });
        }
    }

    // Generar recibos de nómina
    async generatePayrollReceipts(req, res) {
        try {
            const { periodId } = req.params;
            
            if (!periodId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del período es requerido'
                });
            }

            const receiptsData = await PayrollExportService.generatePayrollReceipts(periodId);
            
            res.json({
                success: true,
                data: receiptsData.receipts,
                filename: receiptsData.filename
            });
            
        } catch (error) {
            console.error('Error generando recibos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar recibos de nómina',
                error: error.message
            });
        }
    }

    // Obtener datos de nómina para vista previa
    async getPayrollPreview(req, res) {
        try {
            const { periodId } = req.params;
            
            if (!periodId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del período es requerido'
                });
            }

            const payrollData = await PayrollExportService.getPayrollData(periodId);
            
            // Calcular totales
            const totals = payrollData.reduce((acc, employee) => {
                acc.totalEmployees += 1;
                acc.totalGrossSalary += parseFloat(employee.gross_salary || 0);
                acc.totalDeductions += parseFloat(employee.total_deductions || 0);
                acc.totalNetSalary += parseFloat(employee.net_salary || 0);
                return acc;
            }, {
                totalEmployees: 0,
                totalGrossSalary: 0,
                totalDeductions: 0,
                totalNetSalary: 0
            });

            res.json({
                success: true,
                data: {
                    employees: payrollData,
                    summary: totals,
                    period: payrollData.length > 0 ? {
                        periodNumber: payrollData[0].period_number,
                        startDate: payrollData[0].start_date,
                        endDate: payrollData[0].end_date,
                        paymentDate: payrollData[0].payment_date
                    } : null
                }
            });
            
        } catch (error) {
            console.error('Error obteniendo vista previa:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener vista previa de nómina',
                error: error.message
            });
        }
    }
}

module.exports = new PayrollExportController();

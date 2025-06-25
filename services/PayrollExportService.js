const { pool } = require('../config/dbConfig');
const fs = require('fs').promises;
const path = require('path');

class PayrollExportService {
    
    // Obtener datos completos de nómina para un período
    async getPayrollData(periodId) {
        const query = `
            SELECT 
                pp.period_number,
                pp.start_date,
                pp.end_date,
                pp.payment_date,
                e.employee_number,
                e.first_name,
                e.last_name,
                e.rfc,
                e.curp,
                e.nss,
                e.department,
                e.position,
                e.base_salary,
                e.daily_salary,
                pd.days_worked,
                pd.regular_salary,
                pd.overtime_amount,
                pd.sunday_premium,
                pd.holiday_premium,
                pd.productivity_bonus,
                pd.food_allowance,
                pd.transportation_allowance,
                pd.imss_deduction,
                pd.infonavit_deduction,
                pd.isr_tax,
                pd.loan_deduction,
                pd.alimony_deduction,
                pd.other_deductions,
                pd.gross_salary,
                pd.total_deductions,
                pd.net_salary
            FROM payroll_details pd
            JOIN employees e ON pd.employee_id = e.id
            JOIN payroll_periods pp ON pd.period_id = pp.id
            WHERE pd.period_id = $1
            ORDER BY e.employee_number
        `;
        
        const result = await pool.query(query, [periodId]);
        return result.rows;
    }

    // Exportar a formato CSV para dispersión bancaria
    async exportToCSVForDispersion(periodId) {
        const payrollData = await this.getPayrollData(periodId);
        
        if (payrollData.length === 0) {
            throw new Error('No se encontraron datos de nómina para el período especificado');
        }

        const headers = [
            'NUMERO_EMPLEADO',
            'RFC',
            'NOMBRE_COMPLETO',
            'DEPARTAMENTO',
            'PUESTO',
            'SALARIO_NETO',
            'FECHA_PAGO',
            'PERIODO'
        ];

        let csvContent = headers.join(',') + '\n';

        payrollData.forEach(row => {
            const csvRow = [
                row.employee_number,
                row.rfc,
                `"${row.first_name} ${row.last_name}"`,
                `"${row.department || ''}"`,
                `"${row.position || ''}"`,
                row.net_salary,
                row.payment_date,
                `"${row.start_date} - ${row.end_date}"`
            ];
            csvContent += csvRow.join(',') + '\n';
        });

        return {
            content: csvContent,
            filename: `dispersion_nomina_periodo_${payrollData[0].period_number}_${new Date().toISOString().split('T')[0]}.csv`
        };
    }

    // Exportar a formato XML para PAC (CFDI)
    async exportToXMLForPAC(periodId) {
        const payrollData = await this.getPayrollData(periodId);
        
        if (payrollData.length === 0) {
            throw new Error('No se encontraron datos de nómina para el período especificado');
        }

        const period = payrollData[0];
        
        let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Nomina xmlns="http://www.sat.gob.mx/nomina12" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sat.gob.mx/nomina12 http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd"
        Version="1.2"
        TipoNomina="O"
        FechaPago="${period.payment_date}"
        FechaInicialPago="${period.start_date}"
        FechaFinalPago="${period.end_date}"
        NumDiasPagados="${period.days_worked}">
    
    <Emisor>
        <!-- Datos del emisor - configurar según empresa -->
        <EntidadSNCF>
            <OrigenRecurso>IP</OrigenRecurso>
        </EntidadSNCF>
    </Emisor>
    
    <Receptores>`;

        payrollData.forEach(employee => {
            xmlContent += `
        <Receptor>
            <Curp>${employee.curp}</Curp>
            <NumSeguridadSocial>${employee.nss}</NumSeguridadSocial>
            <FechaInicioRelLaboral>${employee.hire_date || period.start_date}</FechaInicioRelLaboral>
            <TipoContrato>01</TipoContrato>
            <TipoJornada>01</TipoJornada>
            <TipoRegimen>02</TipoRegimen>
            <NumEmpleado>${employee.employee_number}</NumEmpleado>
            <Departamento>${employee.department || 'GENERAL'}</Departamento>
            <Puesto>${employee.position || 'EMPLEADO'}</Puesto>
            <RiesgoPuesto>1</RiesgoPuesto>
            <PeriodicidadPago>04</PeriodicidadPago>
            <SalarioBaseCotApor>${employee.base_salary}</SalarioBaseCotApor>
            <SalarioDiarioIntegrado>${employee.daily_salary}</SalarioDiarioIntegrado>
            <ClaveEntFed>CMX</ClaveEntFed>
            
            <Percepciones TotalSueldos="${employee.regular_salary}" TotalGravado="${employee.gross_salary}" TotalExento="0.00">`;

            // Percepciones
            if (employee.regular_salary > 0) {
                xmlContent += `
                <Percepcion TipoPercepcion="001" Clave="001" Concepto="SUELDO" ImporteGravado="${employee.regular_salary}" ImporteExento="0.00"/>`;
            }
            if (employee.overtime_amount > 0) {
                xmlContent += `
                <Percepcion TipoPercepcion="019" Clave="019" Concepto="HORAS EXTRA" ImporteGravado="${employee.overtime_amount}" ImporteExento="0.00"/>`;
            }
            if (employee.sunday_premium > 0) {
                xmlContent += `
                <Percepcion TipoPercepcion="002" Clave="002" Concepto="PRIMA DOMINICAL" ImporteGravado="${employee.sunday_premium}" ImporteExento="0.00"/>`;
            }
            if (employee.productivity_bonus > 0) {
                xmlContent += `
                <Percepcion TipoPercepcion="021" Clave="021" Concepto="BONO PRODUCTIVIDAD" ImporteGravado="${employee.productivity_bonus}" ImporteExento="0.00"/>`;
            }

            xmlContent += `
            </Percepciones>
            
            <Deducciones TotalOtrasDeducciones="${employee.total_deductions}" TotalImpuestosRetenidos="${employee.isr_tax}">`;

            // Deducciones
            if (employee.imss_deduction > 0) {
                xmlContent += `
                <Deduccion TipoDeduccion="001" Clave="001" Concepto="SEGURIDAD SOCIAL" Importe="${employee.imss_deduction}"/>`;
            }
            if (employee.isr_tax > 0) {
                xmlContent += `
                <Deduccion TipoDeduccion="002" Clave="002" Concepto="ISR" Importe="${employee.isr_tax}"/>`;
            }
            if (employee.infonavit_deduction > 0) {
                xmlContent += `
                <Deduccion TipoDeduccion="006" Clave="006" Concepto="INFONAVIT" Importe="${employee.infonavit_deduction}"/>`;
            }
            if (employee.loan_deduction > 0) {
                xmlContent += `
                <Deduccion TipoDeduccion="004" Clave="004" Concepto="PRESTAMO" Importe="${employee.loan_deduction}"/>`;
            }

            xmlContent += `
            </Deducciones>
        </Receptor>`;
        });

        xmlContent += `
    </Receptores>
</Nomina>`;

        return {
            content: xmlContent,
            filename: `nomina_pac_periodo_${period.period_number}_${new Date().toISOString().split('T')[0]}.xml`
        };
    }

    // Exportar resumen de nómina en formato Excel-compatible CSV
    async exportPayrollSummary(periodId) {
        const payrollData = await this.getPayrollData(periodId);
        
        if (payrollData.length === 0) {
            throw new Error('No se encontraron datos de nómina para el período especificado');
        }

        const headers = [
            'No. Empleado',
            'RFC',
            'Nombre',
            'Departamento',
            'Puesto',
            'Días Trabajados',
            'Salario Base',
            'Sueldo Regular',
            'Horas Extra',
            'Prima Dominical',
            'Bonos',
            'Vales de Despensa',
            'Transporte',
            'Total Percepciones',
            'IMSS',
            'INFONAVIT',
            'ISR',
            'Préstamos',
            'Otras Deducciones',
            'Total Deducciones',
            'Salario Neto'
        ];

        let csvContent = headers.join(',') + '\n';

        payrollData.forEach(row => {
            const csvRow = [
                row.employee_number,
                row.rfc,
                `"${row.first_name} ${row.last_name}"`,
                `"${row.department || ''}"`,
                `"${row.position || ''}"`,
                row.days_worked,
                row.base_salary,
                row.regular_salary,
                row.overtime_amount || 0,
                row.sunday_premium || 0,
                row.productivity_bonus || 0,
                row.food_allowance || 0,
                row.transportation_allowance || 0,
                row.gross_salary,
                row.imss_deduction || 0,
                row.infonavit_deduction || 0,
                row.isr_tax || 0,
                row.loan_deduction || 0,
                row.other_deductions || 0,
                row.total_deductions,
                row.net_salary
            ];
            csvContent += csvRow.join(',') + '\n';
        });

        return {
            content: csvContent,
            filename: `resumen_nomina_periodo_${payrollData[0].period_number}_${new Date().toISOString().split('T')[0]}.csv`
        };
    }

    // Obtener períodos de nómina disponibles
    async getAvailablePayrollPeriods() {
        const query = `
            SELECT 
                pp.id,
                pp.period_number,
                pp.start_date,
                pp.end_date,
                pp.payment_date,
                pp.status,
                COUNT(pd.id) as employee_count,
                SUM(pd.net_salary) as total_net_amount
            FROM payroll_periods pp
            LEFT JOIN payroll_details pd ON pp.id = pd.period_id
            GROUP BY pp.id, pp.period_number, pp.start_date, pp.end_date, pp.payment_date, pp.status
            ORDER BY pp.period_number DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // Generar archivo de recibos de nómina individuales
    async generatePayrollReceipts(periodId) {
        const payrollData = await this.getPayrollData(periodId);
        
        if (payrollData.length === 0) {
            throw new Error('No se encontraron datos de nómina para el período especificado');
        }

        const receipts = payrollData.map(employee => {
            return {
                employeeNumber: employee.employee_number,
                employeeName: `${employee.first_name} ${employee.last_name}`,
                rfc: employee.rfc,
                period: `${employee.start_date} - ${employee.end_date}`,
                paymentDate: employee.payment_date,
                earnings: {
                    regularSalary: employee.regular_salary,
                    overtime: employee.overtime_amount || 0,
                    sundayPremium: employee.sunday_premium || 0,
                    bonuses: employee.productivity_bonus || 0,
                    foodAllowance: employee.food_allowance || 0,
                    transportation: employee.transportation_allowance || 0,
                    total: employee.gross_salary
                },
                deductions: {
                    imss: employee.imss_deduction || 0,
                    infonavit: employee.infonavit_deduction || 0,
                    isr: employee.isr_tax || 0,
                    loans: employee.loan_deduction || 0,
                    others: employee.other_deductions || 0,
                    total: employee.total_deductions
                },
                netSalary: employee.net_salary
            };
        });

        return {
            receipts,
            filename: `recibos_nomina_periodo_${payrollData[0].period_number}_${new Date().toISOString().split('T')[0]}.json`
        };
    }
}

module.exports = new PayrollExportService();

const { pool } = require('../config/dbConfig');

async function insertTestData() {
    try {
        console.log('Insertando datos de prueba...');

        // Insertar empleados de prueba
        const employeesQuery = `
            INSERT INTO employees (
                employee_number, first_name, last_name, rfc, curp, nss,
                birth_date, hire_date, department, position, base_salary, daily_salary
            ) VALUES 
            ('EMP001', 'Juan', 'Pérez García', 'PEGJ850101ABC', 'PEGJ850101HDFRRN01', '12345678901', '1985-01-01', '2020-01-15', 'Administración', 'Gerente', 25000.00, 833.33),
            ('EMP002', 'María', 'López Hernández', 'LOHM900215DEF', 'LOHM900215MDFRRN02', '12345678902', '1990-02-15', '2021-03-01', 'Ventas', 'Ejecutivo', 18000.00, 600.00),
            ('EMP003', 'Carlos', 'Martínez Ruiz', 'MARC880310GHI', 'MARC880310HDFRRN03', '12345678903', '1988-03-10', '2019-06-01', 'Sistemas', 'Desarrollador', 22000.00, 733.33),
            ('EMP004', 'Ana', 'González Torres', 'GOTA920520JKL', 'GOTA920520MDFRRN04', '12345678904', '1992-05-20', '2022-01-10', 'Recursos Humanos', 'Analista', 16000.00, 533.33),
            ('EMP005', 'Luis', 'Rodríguez Silva', 'ROSL870815MNO', 'ROSL870815HDFRRN05', '12345678905', '1987-08-15', '2020-09-01', 'Contabilidad', 'Contador', 20000.00, 666.67)
            ON CONFLICT (employee_number) DO NOTHING;
        `;

        await pool.query(employeesQuery);
        console.log('Empleados insertados correctamente');

        // Insertar período de nómina
        const periodQuery = `
            INSERT INTO payroll_periods (
                period_number, start_date, end_date, payment_date, status
            ) VALUES 
            (1, '2024-01-01', '2024-01-15', '2024-01-16', 'PROCESSED'),
            (2, '2024-01-16', '2024-01-31', '2024-02-01', 'PROCESSED'),
            (3, '2024-02-01', '2024-02-15', '2024-02-16', 'DRAFT')
            ON CONFLICT DO NOTHING;
        `;

        await pool.query(periodQuery);
        console.log('Períodos de nómina insertados correctamente');

        // Obtener IDs de empleados y períodos
        const employeesResult = await pool.query('SELECT id, employee_number, base_salary, daily_salary FROM employees ORDER BY employee_number');
        const periodsResult = await pool.query('SELECT id, period_number FROM payroll_periods WHERE period_number IN (1, 2) ORDER BY period_number');

        if (employeesResult.rows.length > 0 && periodsResult.rows.length > 0) {
            // Insertar detalles de nómina para el período 1
            for (const employee of employeesResult.rows) {
                const period = periodsResult.rows[0]; // Período 1
                
                const grossSalary = parseFloat(employee.base_salary);
                const imssDeduction = grossSalary * 0.0725; // 7.25% IMSS
                const isrTax = grossSalary * 0.10; // 10% ISR aproximado
                const totalDeductions = imssDeduction + isrTax;
                const netSalary = grossSalary - totalDeductions;

                const payrollDetailQuery = `
                    INSERT INTO payroll_details (
                        period_id, employee_id, base_salary, days_worked,
                        regular_salary, overtime_amount, sunday_premium, holiday_premium,
                        productivity_bonus, food_allowance, transportation_allowance,
                        imss_deduction, infonavit_deduction, isr_tax, loan_deduction,
                        alimony_deduction, other_deductions,
                        gross_salary, total_deductions, net_salary
                    ) VALUES (
                        $1, $2, $3, 15,
                        $4, 0, 0, 0,
                        0, 500, 300,
                        $5, 0, $6, 0,
                        0, 0,
                        $7, $8, $9
                    ) ON CONFLICT DO NOTHING;
                `;

                await pool.query(payrollDetailQuery, [
                    period.id, employee.id, employee.base_salary,
                    grossSalary, imssDeduction, isrTax,
                    grossSalary, totalDeductions, netSalary
                ]);
            }

            // Insertar detalles de nómina para el período 2
            for (const employee of employeesResult.rows) {
                const period = periodsResult.rows[1]; // Período 2
                
                const grossSalary = parseFloat(employee.base_salary);
                const overtimeAmount = grossSalary * 0.05; // 5% horas extra
                const totalGross = grossSalary + overtimeAmount;
                const imssDeduction = totalGross * 0.0725;
                const isrTax = totalGross * 0.10;
                const totalDeductions = imssDeduction + isrTax;
                const netSalary = totalGross - totalDeductions;

                const payrollDetailQuery = `
                    INSERT INTO payroll_details (
                        period_id, employee_id, base_salary, days_worked,
                        regular_salary, overtime_amount, sunday_premium, holiday_premium,
                        productivity_bonus, food_allowance, transportation_allowance,
                        imss_deduction, infonavit_deduction, isr_tax, loan_deduction,
                        alimony_deduction, other_deductions,
                        gross_salary, total_deductions, net_salary
                    ) VALUES (
                        $1, $2, $3, 15,
                        $4, $5, 0, 0,
                        1000, 500, 300,
                        $6, 0, $7, 0,
                        0, 0,
                        $8, $9, $10
                    ) ON CONFLICT DO NOTHING;
                `;

                await pool.query(payrollDetailQuery, [
                    period.id, employee.id, employee.base_salary,
                    grossSalary, overtimeAmount, imssDeduction, isrTax,
                    totalGross, totalDeductions, netSalary
                ]);
            }

            console.log('Detalles de nómina insertados correctamente');
        }

        console.log('¡Datos de prueba insertados exitosamente!');
        
    } catch (error) {
        console.error('Error insertando datos de prueba:', error);
    } finally {
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    insertTestData();
}

module.exports = { insertTestData };

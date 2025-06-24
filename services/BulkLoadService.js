const fs = require('fs');
const csv = require('csv-parse');
const { pool } = require('../config/dbConfig');
const format = require('pg-format');

class BulkLoadService {
    constructor() {
        this.requiredFields = [
            'employee_number',
            'first_name',
            'last_name',
            'rfc',
            'curp',
            'nss',
            'birth_date',
            'hire_date',
            'department',
            'position',
            'base_salary'
        ];
    }

    validateEmployee(employee) {
        const errors = [];

        // Check for required fields
        this.requiredFields.forEach(field => {
            if (!employee[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Validate RFC format (13 characters)
        if (employee.rfc && !/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(employee.rfc)) {
            errors.push('Invalid RFC format');
        }

        // Validate CURP format (18 characters)
        if (employee.curp && !/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$/.test(employee.curp)) {
            errors.push('Invalid CURP format');
        }

        // Validate NSS format (11 digits)
        if (employee.nss && !/^[0-9]{11}$/.test(employee.nss)) {
            errors.push('Invalid NSS format');
        }

        // Validate dates
        try {
            if (employee.birth_date) {
                const birthDate = new Date(employee.birth_date);
                if (isNaN(birthDate.getTime())) {
                    errors.push('Invalid birth date format');
                }
            }
            if (employee.hire_date) {
                const hireDate = new Date(employee.hire_date);
                if (isNaN(hireDate.getTime())) {
                    errors.push('Invalid hire date format');
                }
            }
        } catch (e) {
            errors.push('Invalid date format');
        }

        // Validate salary (must be positive number)
        if (isNaN(parseFloat(employee.base_salary)) || parseFloat(employee.base_salary) <= 0) {
            errors.push('Invalid base salary');
        }

        return errors;
    }

    async processCSVFile(filePath) {
        const results = {
            success: [],
            errors: []
        };

        return new Promise((resolve, reject) => {
            const employees = [];
            
            fs.createReadStream(filePath)
                .pipe(csv.parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                }))
                .on('data', (row) => {
                    const validationErrors = this.validateEmployee(row);
                    
                    if (validationErrors.length === 0) {
                        // Calculate daily salary (monthly base salary / 30)
                        const dailySalary = parseFloat(row.base_salary) / 30;
                        
                        employees.push([
                            row.employee_number,
                            row.first_name,
                            row.last_name,
                            row.rfc,
                            row.curp,
                            row.nss,
                            row.birth_date,
                            row.hire_date,
                            row.department,
                            row.position,
                            parseFloat(row.base_salary),
                            dailySalary,
                            'ACTIVE'
                        ]);
                        results.success.push(row.employee_number);
                    } else {
                        results.errors.push({
                            employee_number: row.employee_number || 'UNKNOWN',
                            errors: validationErrors
                        });
                    }
                })
                .on('end', async () => {
                    try {
                        if (employees.length > 0) {
                            const query = format(
                                'INSERT INTO employees (employee_number, first_name, last_name, rfc, curp, nss, birth_date, hire_date, department, position, base_salary, daily_salary, status) VALUES %L',
                                employees
                            );
                            
                            await pool.query(query);
                        }
                        resolve(results);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    async generateTemplateCSV() {
        const template = [
            'employee_number,first_name,last_name,rfc,curp,nss,birth_date,hire_date,department,position,base_salary',
            'EMP001,Juan,Pérez,PERJ901231ABC,PERJ901231HDFXXX01,12345678901,1990-12-31,2022-01-15,IT,Developer,25000.00'
        ].join('\n');

        return template;
    }
}

module.exports = new BulkLoadService();

const BulkLoadService = require('../services/BulkLoadService');
const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/dbConfig');

describe('BulkLoadService', () => {
    const validEmployee = {
        employee_number: 'EMP001',
        first_name: 'Juan',
        last_name: 'Pérez',
        rfc: 'PELJ901231ABC',
        curp: 'PELJ901231HDFXXX01',
        nss: '12345678901',
        birth_date: '1990-12-31',
        hire_date: '2022-01-15',
        department: 'IT',
        position: 'Developer',
        base_salary: '25000.00'
    };

    describe('validateEmployee', () => {
        test('should validate a correct employee record', () => {
            const errors = BulkLoadService.validateEmployee(validEmployee);
            expect(errors).toHaveLength(0);
        });

        test('should detect missing required fields', () => {
            const invalidEmployee = { ...validEmployee };
            delete invalidEmployee.rfc;
            
            const errors = BulkLoadService.validateEmployee(invalidEmployee);
            expect(errors).toContain('Missing required field: rfc');
        });

        test('should validate RFC format', () => {
            const invalidEmployee = { 
                ...validEmployee,
                rfc: 'INVALID'
            };
            
            const errors = BulkLoadService.validateEmployee(invalidEmployee);
            expect(errors).toContain('Invalid RFC format');
        });

        test('should validate CURP format', () => {
            const invalidEmployee = { 
                ...validEmployee,
                curp: 'INVALID'
            };
            
            const errors = BulkLoadService.validateEmployee(invalidEmployee);
            expect(errors).toContain('Invalid CURP format');
        });

        test('should validate NSS format', () => {
            const invalidEmployee = { 
                ...validEmployee,
                nss: '123'  // Too short
            };
            
            const errors = BulkLoadService.validateEmployee(invalidEmployee);
            expect(errors).toContain('Invalid NSS format');
        });

        test('should validate date formats', () => {
            const invalidEmployee = { 
                ...validEmployee,
                birth_date: 'invalid-date'
            };
            
            const errors = BulkLoadService.validateEmployee(invalidEmployee);
            expect(errors).toContain('Invalid birth date format');
        });

        test('should validate salary is positive', () => {
            const invalidEmployee = { 
                ...validEmployee,
                base_salary: '-1000'
            };
            
            const errors = BulkLoadService.validateEmployee(invalidEmployee);
            expect(errors).toContain('Invalid base salary');
        });
    });

    describe('processCSVFile', () => {
        const testFilePath = path.join(__dirname, 'test_employees.csv');
        
        beforeEach(async () => {
            // Create a test CSV file
            const csvContent = [
                'employee_number,first_name,last_name,rfc,curp,nss,birth_date,hire_date,department,position,base_salary',
                'EMP001,Juan,Pérez,PELJ901231ABC,PELJ901231HDFXXX01,12345678901,1990-12-31,2022-01-15,IT,Developer,25000.00',
                'EMP002,INVALID,DATA,BAD-RFC,BAD-CURP,123,1990-13-45,2022-01-15,IT,Developer,-1000'
            ].join('\n');
            
            await fs.writeFile(testFilePath, csvContent);
        });

        afterEach(async () => {
            // Clean up test file
            try {
                await fs.unlink(testFilePath);
            } catch (error) {
                console.error('Error cleaning up test file:', error);
            }

            // Clean up test data from database
            try {
                await pool.query('DELETE FROM employees WHERE employee_number IN ($1, $2)', ['EMP001', 'EMP002']);
            } catch (error) {
                console.error('Error cleaning up test data:', error);
            }
        });

        test('should process valid records and report invalid ones', async () => {
            const results = await BulkLoadService.processCSVFile(testFilePath);
            
            expect(results.success).toHaveLength(1);
            expect(results.success).toContain('EMP001');
            
            expect(results.errors).toHaveLength(1);
            expect(results.errors[0].employee_number).toBe('EMP002');
            expect(results.errors[0].errors).toContain('Invalid RFC format');
        });
    });

    describe('generateTemplateCSV', () => {
        test('should generate a valid CSV template', async () => {
            const template = await BulkLoadService.generateTemplateCSV();
            
            expect(template).toContain('employee_number,first_name,last_name,rfc,curp,nss,birth_date,hire_date,department,position,base_salary');
            expect(template).toContain('EMP001');  // Sample data line
        });
    });
});

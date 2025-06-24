# Mexican Payroll Processing System

A comprehensive payroll processing system designed for Mexican companies, compliant with Mexican Federal Labor Law (Ley Federal del Trabajo de México).

## Features

- Bulk employee data import
- Payroll processing for 500-1000 employees
- Mexican labor law compliance
- Automatic calculation of:
  - IMSS contributions (2.375%)
  - INFONAVIT deductions (5%)
  - Variable ISR calculations
  - Aguinaldo (Christmas bonus)
  - Vacation pay
  - Various deductions (loans, alimony, life insurance)
  - Productivity bonuses
  - Overtime pay
  - Sunday premium pay

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd payroll-system
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the .env file with your database credentials and other configurations.

5. Create and initialize the database:
```bash
npm run db:create
```

## Bulk Loading Employee Data

### File Format
Employee data should be provided in CSV format with the following columns:
- employee_number (unique identifier)
- first_name
- last_name
- rfc (13 characters)
- curp (18 characters)
- nss (11 digits)
- birth_date (YYYY-MM-DD)
- hire_date (YYYY-MM-DD)
- department
- position
- base_salary (monthly salary in MXN)

### Sample Data
A sample employee data file is provided in `examples/sample_employee_data.csv`

### API Endpoints

#### Get CSV Template
```
GET /api/bulk/template
```
Downloads a CSV template file with the correct format and sample data.

#### Upload Employee Data
```
POST /api/bulk/upload
Content-Type: multipart/form-data
file: [CSV file]
```
Uploads and processes employee data from a CSV file.

#### Check Upload Status
```
GET /api/bulk/status/:batch_id
```
Checks the status of a bulk upload operation.

### Validation Rules

The system validates the following:
1. Required fields presence
2. RFC format (13 characters)
3. CURP format (18 characters)
4. NSS format (11 digits)
5. Valid dates for birth_date and hire_date
6. Positive base salary values

### Error Handling

The bulk upload process will:
1. Validate all records before processing
2. Provide detailed error messages for invalid records
3. Continue processing valid records even if some are invalid
4. Return a summary of successful and failed imports

## Development

Start the development server:
```bash
npm run dev
```

The server will start on port 3000 (or the port specified in your .env file).

## Testing

Run the test suite:
```bash
npm test
```

## Production Deployment

For production deployment:

1. Update environment variables for production
2. Build the application:
```bash
npm run build
```

3. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact [support email/contact information]

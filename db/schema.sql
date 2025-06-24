-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table
CREATE TABLE employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    rfc VARCHAR(13) NOT NULL UNIQUE,
    curp VARCHAR(18) NOT NULL UNIQUE,
    nss VARCHAR(11) NOT NULL UNIQUE,
    birth_date DATE NOT NULL,
    hire_date DATE NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    base_salary DECIMAL(10,2) NOT NULL,
    daily_salary DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Periods table
CREATE TABLE payroll_periods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    period_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee Attendance table
CREATE TABLE employee_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    regular_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    sunday_worked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Details table
CREATE TABLE payroll_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    period_id UUID REFERENCES payroll_periods(id),
    employee_id UUID REFERENCES employees(id),
    base_salary DECIMAL(10,2) NOT NULL,
    days_worked INTEGER NOT NULL,
    -- Earnings
    regular_salary DECIMAL(10,2) NOT NULL,
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    sunday_premium DECIMAL(10,2) DEFAULT 0,
    holiday_premium DECIMAL(10,2) DEFAULT 0,
    productivity_bonus DECIMAL(10,2) DEFAULT 0,
    food_allowance DECIMAL(10,2) DEFAULT 0,
    transportation_allowance DECIMAL(10,2) DEFAULT 0,
    -- Deductions
    imss_deduction DECIMAL(10,2) DEFAULT 0,
    infonavit_deduction DECIMAL(10,2) DEFAULT 0,
    isr_tax DECIMAL(10,2) DEFAULT 0,
    loan_deduction DECIMAL(10,2) DEFAULT 0,
    alimony_deduction DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    -- Totals
    gross_salary DECIMAL(10,2) NOT NULL,
    total_deductions DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee Loans table
CREATE TABLE employee_loans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    loan_amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    monthly_payment DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_employee_number ON employees(employee_number);
CREATE INDEX idx_employee_rfc ON employees(rfc);
CREATE INDEX idx_employee_status ON employees(status);
CREATE INDEX idx_attendance_date ON employee_attendance(date);
CREATE INDEX idx_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX idx_payroll_period ON payroll_details(period_id);
CREATE INDEX idx_payroll_employee ON payroll_details(employee_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_periods_updated_at
    BEFORE UPDATE ON payroll_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_attendance_updated_at
    BEFORE UPDATE ON employee_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_details_updated_at
    BEFORE UPDATE ON payroll_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_loans_updated_at
    BEFORE UPDATE ON employee_loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

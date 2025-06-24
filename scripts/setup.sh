#!/bin/bash

# Make script exit on first error
set -e

echo "Setting up Mexican Payroll Processing System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install PostgreSQL and try again."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please update the .env file with your database credentials."
fi

# Create database and run migrations
echo "Setting up database..."
node scripts/createDatabase.js

echo "Setup completed successfully!"
echo "Next steps:"
echo "1. Update the .env file with your database credentials if you haven't already"
echo "2. Start the development server with: npm run dev"
echo "3. Check the README.md for API documentation and usage instructions"

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database connection for creating new database
const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function createDatabase() {
    try {
        // Connect to PostgreSQL server
        await client.connect();

        // Check if database exists
        const dbName = process.env.DB_NAME || 'payroll_system';
        const checkDb = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );

        if (checkDb.rows.length === 0) {
            // Create database if it doesn't exist
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`Database ${dbName} created successfully`);
        } else {
            console.log(`Database ${dbName} already exists`);
        }

        // Disconnect from PostgreSQL server
        await client.end();

        // Connect to the new database and create schema
        const dbClient = new Client({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: dbName,
            password: process.env.DB_PASSWORD || 'postgres',
            port: process.env.DB_PORT || 5432,
        });

        await dbClient.connect();

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const schemaSql = await fs.readFile(schemaPath, 'utf8');
        await dbClient.query(schemaSql);

        console.log('Database schema created successfully');
        await dbClient.end();

    } catch (error) {
        console.error('Error creating database:', error);
        process.exit(1);
    }
}

createDatabase();

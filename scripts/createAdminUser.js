const bcrypt = require('bcryptjs');
const { pool } = require('../config/dbConfig');

async function createAdminUser() {
    try {
        // Generate password hash
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert admin user
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role_id, is_active)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, email`,
            ['admin', 'admin@example.com', hashedPassword, '937e3cd6-f5ed-4842-9f95-653365c15c5d', true]
        );

        console.log('Admin user created successfully:', result.rows[0]);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();

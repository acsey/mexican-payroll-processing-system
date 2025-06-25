const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/dbConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

class AuthService {
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }

    async comparePasswords(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    generateToken(userId, role, roleName) {
        return jwt.sign(
            { 
                userId, 
                role,
                role_name: roleName 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    async createUser({ username, email, password, roleId }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Check if user already exists
            const userExists = await client.query(
                'SELECT id FROM users WHERE username = $1 OR email = $2',
                [username, email]
            );

            if (userExists.rows.length > 0) {
                throw new Error('Usuario o correo electrónico ya existe');
            }

            const hashedPassword = await this.hashPassword(password);

            const result = await client.query(
                `INSERT INTO users (username, email, password_hash, role_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id, username, email, role_id`,
                [username, email, hashedPassword, roleId]
            );

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async login(username, password) {
        const result = await pool.query(
            `SELECT u.id, u.username, u.password_hash, u.email, r.id as role_id, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = $1 AND u.is_active = true`,
            [username]
        );

        if (result.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        const user = result.rows[0];
        const validPassword = await this.comparePasswords(password, user.password_hash);

        if (!validPassword) {
            throw new Error('Contraseña incorrecta');
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        const token = this.generateToken(user.id, user.role_id, user.role_name);

        // Store session
        await pool.query(
            `INSERT INTO user_sessions (user_id, token, expires_at)
            VALUES ($1, $2, NOW() + interval '24 hours')`,
            [user.id, token]
        );

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role_id: user.role_id,
                role_name: user.role_name
            },
            token
        };
    }

    async logout(token) {
        await pool.query(
            'DELETE FROM user_sessions WHERE token = $1',
            [token]
        );
    }

    async validateSession(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const session = await pool.query(
                'SELECT * FROM user_sessions WHERE token = $1 AND expires_at > NOW()',
                [token]
            );

            if (session.rows.length === 0) {
                throw new Error('Sesión inválida');
            }

            return decoded;
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    async getUserById(userId) {
        const result = await pool.query(
            `SELECT u.id, u.username, u.email, r.id as role_id, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        return result.rows[0];
    }
}

module.exports = new AuthService();

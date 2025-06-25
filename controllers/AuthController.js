const AuthService = require('../services/AuthService');
const { pool } = require('../config/dbConfig');

class AuthController {
    async register(req, res) {
        try {
            const { username, email, password, roleId } = req.body;

            if (!username || !email || !password || !roleId) {
                return res.status(400).json({
                    status: 'error',
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            const user = await AuthService.createUser({
                username,
                email,
                password,
                roleId
            });

            res.status(201).json({
                status: 'success',
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role_id
                    }
                }
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                success: false,
                message: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    status: 'error',
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            const result = await AuthService.login(username, password);

            // Set cookie with token
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.json({
                status: 'success',
                success: true,
                data: {
                    user: result.user,
                    token: result.token
                }
            });
        } catch (error) {
            res.status(401).json({
                status: 'error',
                success: false,
                message: error.message
            });
        }
    }

    async logout(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
            
            if (token) {
                await AuthService.logout(token);
            }

            res.clearCookie('token');
            
            res.json({
                status: 'success',
                success: true,
                message: 'Sesión cerrada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                success: false,
                message: error.message
            });
        }
    }

    async getProfile(req, res) {
        try {
            const user = await AuthService.getUserById(req.user.userId);
            
            res.json({
                status: 'success',
                success: true,
                data: {
                    user
                }
            });
        } catch (error) {
            res.status(404).json({
                status: 'error',
                success: false,
                message: error.message
            });
        }
    }

    async getRoles(req, res) {
        try {
            const result = await pool.query('SELECT id, name, description FROM roles');
            
            res.json({
                status: 'success',
                success: true,
                data: {
                    roles: result.rows
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                success: false,
                message: 'Error al obtener roles'
            });
        }
    }

    async getUsers(req, res) {
        try {
            const result = await pool.query(`
                SELECT u.id, u.username, u.email, u.is_active, r.name as role
                FROM users u
                JOIN roles r ON u.role_id = r.id
                ORDER BY u.username
            `);
            
            res.json({
                status: 'success',
                success: true,
                data: {
                    users: result.rows
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                success: false,
                message: 'Error al obtener usuarios',
                error: error.message
            });
        }
    }
}

module.exports = new AuthController();

const AuthService = require('../services/AuthService');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                status: 'error',
                success: false,
                message: 'No se proporcionó token de autenticación'
            });
        }

        const decoded = await AuthService.validateSession(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'error',
            success: false,
            message: 'Token inválido o sesión expirada',
            error: error.message
        });
    }
};

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (!allowedRoles.includes(req.user.role_name)) {
            return res.status(403).json({
                status: 'error',
                success: false,
                message: 'No tiene permisos para acceder a este recurso'
            });
        }

        next();
    };
};

// Middleware específicos por rol
// Role-specific middleware
const isAdmin = roleMiddleware('admin');
const isEmployee = roleMiddleware('employee');
const isAccountant = roleMiddleware('accountant');
const isHR = roleMiddleware('hr');

module.exports = {
    authMiddleware,
    roleMiddleware,
    isAdmin,
    isEmployee,
    isAccountant,
    isHR
};

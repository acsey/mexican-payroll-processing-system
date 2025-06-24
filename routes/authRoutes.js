const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// Rutas protegidas
router.get('/profile', authMiddleware, AuthController.getProfile);
router.get('/roles', authMiddleware, isAdmin, AuthController.getRoles);

module.exports = router;

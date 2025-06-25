const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', AuthController.login);

// Protected routes
router.use(authMiddleware);
router.post('/register', AuthController.register);
router.post('/logout', AuthController.logout);
router.get('/profile', AuthController.getProfile);
router.get('/roles', AuthController.getRoles);
router.get('/users', AuthController.getUsers);

module.exports = router;

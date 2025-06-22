const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticateJWT, authController.logout);
router.get('/check', authenticateJWT, authController.check);

module.exports = router;
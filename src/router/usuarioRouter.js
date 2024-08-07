const express = require('express');
const router = express.Router();
const { crear, login } = require('../controller/userController');
const authMiddleware = require('../middleware/auth.middleware');


router.post('/crear', crear); // Ruta para crear usuario
router.post('/login', login, authMiddleware); // Ruta para iniciar sesión

module.exports = router;

const express = require('express');
const userController = require('../controllers/user.js');
const isAuthenticated = require('../middleware/isAuth.js');
const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', isAuthenticated, userController.profile);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Registration
router.post('/users', userController.registerUser);
// Login
router.post('/users/login', userController.loginUser);


module.exports = router;

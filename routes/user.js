const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Registration
router.post('/users', userController.registerUser);

module.exports = router;

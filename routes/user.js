const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const userController = require('../controllers/userController');

// Registration
router.post('/users', userController.registerUser);
// Login
router.post('/users/login', userController.loginUser);
// Get current user
router.get('/user', verifyToken, userController.getCurrentUser);
// Update User
router.put('/user', verifyToken, userController.updateUser);
// Delete User
router.delete('/user', verifyToken, userController.deleteUser);
// get profile
router.get('/profile/:username', verifyToken, userController.getProfile);
// follow user
router.post('/profile/:username/follow', verifyToken, userController.followUser);
// unfollow user
router.put('/profile/:username/unfollow', verifyToken, userController.unfollowUser);
module.exports = router;

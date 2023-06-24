const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const verifyJWTOptional = require('../middleware/authOptinal');
const commentController = require('../controllers/commentController');

// Add comment 
router.post('/comment/:slug', verifyToken, commentController.addCommentToArticle);
// get comments of a article by slug
router.get('/comments/:slug', verifyJWTOptional, commentController.getCommentsOfArticle);
// update comment

module.exports = router;

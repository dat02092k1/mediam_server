const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const articleController = require('../controllers/articleController');

// Add article 
router.post('/article', verifyToken, articleController.createArticle);
// Login
router.get('/article/:slug', verifyToken, articleController.getArticleBySlug);

module.exports = router;

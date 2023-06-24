const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const articleController = require('../controllers/articleController');

// Add article 
router.post('/article', verifyToken, articleController.createArticle);
// get article by slug
router.get('/article/:slug', verifyToken, articleController.getArticleBySlug);
// delete article
router.delete('/article/:slug', verifyToken, articleController.deleteArticle);
// update article
router.put('/article/:slug', verifyToken, articleController.updateArticle);
// favor article
router.put('/article/:slug/favor', verifyToken, articleController.favoriteArticle);
// unfavor article
router.put('/article/:slug/unfavor', verifyToken, articleController.unFavoriteArticle);

module.exports = router;

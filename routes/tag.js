const express = require('express');
const router = express.Router();

const tagController = require('../controllers/tagController');

// get all tags 
router.get('/tags', tagController.getTags);
// get popular tags
router.get('/tags/popular', tagController.getPopularTags);
module.exports = router;
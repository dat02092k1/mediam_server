const express = require('express');
const router = express.Router();

const tagController = require('../controllers/tagController');

// get all tags 
router.get('/tags', tagController.getTags);

module.exports = router;
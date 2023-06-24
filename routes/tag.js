const express = require('express');
const router = express.Router();

const tagController = require('../controllers/tagController');

// get all tags 
router.tag('/tags', tagController.getTags);

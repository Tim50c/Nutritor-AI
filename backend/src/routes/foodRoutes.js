const express = require('express');
const router = express.Router();
const { getFoodDetails } = require('../controllers/foodsController');
const { getFoodSuggestions } = require('../controllers/foodSuggestionsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/suggestions', authMiddleware, getFoodSuggestions);
router.get('/:foodId', authMiddleware, getFoodDetails);

module.exports = router;
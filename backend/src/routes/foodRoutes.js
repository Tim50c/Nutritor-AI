const express = require('express');
const router = express.Router();
const { getFoodDetails, updateFoodImage } = require('../controllers/foodsController');
const { getFoodSuggestions } = require('../controllers/foodSuggestionsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/suggestions', authMiddleware, getFoodSuggestions);
router.get('/:foodId', authMiddleware, getFoodDetails);
router.put('/:foodId/image', authMiddleware, updateFoodImage);

module.exports = router;
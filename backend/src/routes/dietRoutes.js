const express = require('express');
const router = express.Router();
const { getDiet, addFoodToDiet, removeFoodFromDiet, getConsumedNutrition } = require('../controllers/dietController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getDiet);
router.get('/nutrition', authMiddleware, getConsumedNutrition);
router.post('/', authMiddleware, addFoodToDiet);
router.delete('/:foodId', authMiddleware, removeFoodFromDiet);

module.exports = router;
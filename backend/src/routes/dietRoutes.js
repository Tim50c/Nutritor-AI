const express = require('express');
const router = express.Router();

const { 
  getDiet, 
  addFoodToDiet, 
  removeFoodFromDiet, 
  getDailyNutrition,
  getWeeklyNutrition,
  getMonthlyNutrition
} = require('../controllers/dietController');

const authMiddleware = require('../middleware/authMiddleware');


router.get('/', authMiddleware, getDiet);
router.get('/nutrition/daily', authMiddleware, getDailyNutrition);
router.get('/nutrition/weekly', authMiddleware, getWeeklyNutrition);
router.get('/nutrition/monthly', authMiddleware, getMonthlyNutrition);
router.post('/', authMiddleware, addFoodToDiet);
router.delete('/:foodId', authMiddleware, removeFoodFromDiet);

module.exports = router;
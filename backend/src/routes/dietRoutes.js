const express = require('express');
const router = express.Router();
const { getDiet, addFoodToDiet, removeFoodFromDiet } = require('../controllers/dietController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getDiet);
router.post('/', authMiddleware, addFoodToDiet);
router.delete('/:foodId', authMiddleware, removeFoodFromDiet);

module.exports = router;
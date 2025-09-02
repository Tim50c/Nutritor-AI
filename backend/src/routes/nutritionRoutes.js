// backend/src/routes/nutritionRoutes.js
const express = require('express');
const router = express.Router();
const { predictNutrition } = require('../controllers/nutritionController');
const authMiddleware = require('../middleware/authMiddleware');

// This route will be protected by the same authentication middleware
router.post('/predict', authMiddleware, predictNutrition);

module.exports = router;
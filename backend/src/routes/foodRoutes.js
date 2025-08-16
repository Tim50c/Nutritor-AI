const express = require('express');
const router = express.Router();
const { getFoodDetails } = require('../controllers/foodsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:foodId', authMiddleware, getFoodDetails);

module.exports = router;
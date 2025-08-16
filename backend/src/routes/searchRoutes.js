const express = require('express');
const router = express.Router();
const { searchFoods } = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, searchFoods);

module.exports = router;
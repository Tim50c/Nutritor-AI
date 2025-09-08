const express = require('express');
const router = express.Router();
const { searchFoods, loadCache } = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, searchFoods);
router.get('/load-cache', authMiddleware, loadCache);

module.exports = router;
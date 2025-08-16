const express = require('express');
const router = express.Router();
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoritesController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getFavorites);
router.post('/', authMiddleware, addFavorite);
router.delete('/:foodId', authMiddleware, removeFavorite);

module.exports = router;
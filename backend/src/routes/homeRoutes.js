const express = require('express');
const router = express.Router();
const { getHomeData } = require('../controllers/homeControllers');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getHomeData);

module.exports = router;
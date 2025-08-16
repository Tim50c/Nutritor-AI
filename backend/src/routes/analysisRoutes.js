const express = require('express');
const router = express.Router();
const { getAnalysis, updateWeight } = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAnalysis);
router.patch('/weight', authMiddleware, updateWeight);

module.exports = router;
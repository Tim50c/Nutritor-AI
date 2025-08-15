// src/routes/calorieRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const C = require('../controllers/calorieController');

router.post('/log', auth, C.logCalories);
router.get('/', auth, C.getLogs);
router.get('/:id', auth, C.getLog);
router.put('/:id', auth, C.updateLog);
router.delete('/:id', auth, C.deleteLog);

module.exports = router;

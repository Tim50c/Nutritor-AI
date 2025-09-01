const express = require('express');
const router = express.Router();
const { getUserProfile, createUserProfile, updateUserProfile, getUserNutritionTarget } = require('../controllers/profileController');
const { registerUserProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getUserProfile);
router.get('/nutrition-target', authMiddleware, getUserNutritionTarget);
// router.post('/', authMiddleware, registerUserProfile);
router.patch('/', authMiddleware, updateUserProfile);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getUserProfile, createUserProfile, updateUserProfile } = require('../controllers/profileController');
const { registerUserProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getUserProfile);
// router.post('/', authMiddleware, registerUserProfile);
router.patch('/', authMiddleware, updateUserProfile);

module.exports = router;
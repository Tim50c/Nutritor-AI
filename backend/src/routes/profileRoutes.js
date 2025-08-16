const express = require('express');
const router = express.Router();
const { getUserProfile, createUserProfile, updateUserProfile } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getUserProfile);
router.post('/', authMiddleware, createUserProfile);
router.patch('/', authMiddleware, updateUserProfile);

module.exports = router;
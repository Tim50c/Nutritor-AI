const express = require('express');
const router = express.Router();
const { registerUserProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// This route is protected. The front-end must have already signed up the user
// with Firebase Auth and must send the user's ID token in the header.
router.post('/register', authMiddleware, registerUserProfile);

module.exports = router;
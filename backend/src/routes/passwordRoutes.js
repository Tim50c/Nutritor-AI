const express = require('express');
const router = express.Router();
const { changePassword } = require('../controllers/passwordController');
const authMiddleware = require('../middleware/authMiddleware');

router.patch('/', authMiddleware, changePassword);

module.exports = router;
const express = require('express');
const router = express.Router();
const multer = require('multer'); // <-- 1. Import multer

// 2. Import the new controller for avatar updates
const { 
  getUserProfile, 
  createUserProfile, 
  updateUserProfile, 
  getUserNutritionTarget,
  updateUserAvatar // <-- New
} = require('../controllers/profileController');

// Note: Your file uses 'authMiddleware', so we use that name.
const authMiddleware = require('../middleware/authMiddleware');

// 3. Configure multer for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// All routes use the authentication middleware
router.use(authMiddleware);

// Existing Profile Routes
router.get('/', getUserProfile);
router.get('/nutrition-target', getUserNutritionTarget);
router.patch('/', updateUserProfile);

// 4. Add the new route specifically for avatar uploads
// It uses multer's 'upload.single()' middleware to handle a file named 'avatar'
router.patch('/avatar', upload.single('avatar'), updateUserAvatar);

// Note: The POST for creating a user profile should likely live in `authRoutes.js`
// as it's part of registration. I've left your structure as-is.
// router.post('/', createUserProfile); // You had this commented out, which is good practice.

module.exports = router;
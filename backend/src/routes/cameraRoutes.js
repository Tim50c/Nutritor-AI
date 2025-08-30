const express = require('express');
const multer = require('multer');
const { 
  recognizeFoodDetails,
  recognizeBarcode,
  addFood
} = require('../controllers/cameraController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Set up multer for handling image uploads (same as chatbot)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Protect all routes in this file
// router.use(authMiddleware);

router.post('/recognize-details', upload.single('image'), recognizeFoodDetails);
router.post('/barcode', recognizeBarcode);
router.post('/add-food', addFood);

module.exports = router;
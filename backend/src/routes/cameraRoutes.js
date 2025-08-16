const express = require('express');
const { 
  recognizeFoodDetails,
  recognizeBarcode,
  addFood
} = require('../controllers/cameraController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes in this file
router.use(authMiddleware);

router.post('/recognize-details', recognizeFoodDetails);
router.post('/barcode', recognizeBarcode);
router.post('/add-food', addFood);

module.exports = router;
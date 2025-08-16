const express = require('express');
const router = express.Router();
const { recognizeImage, recognizeBarcode } = require('../controllers/cameraController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/recognize', authMiddleware, recognizeImage);
router.post('/barcode', authMiddleware, recognizeBarcode);

module.exports = router;
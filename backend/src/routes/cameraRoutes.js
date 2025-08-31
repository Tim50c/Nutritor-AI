const express = require('express');
const multer = require('multer');
const { 
  recognizeFoodDetails,
  recognizeBarcode,
  addFood
} = require('../controllers/cameraController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Enhanced multer setup with better error handling and limits
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to log incoming requests
router.use((req, res, next) => {
  console.log(`📍 Camera Route: ${req.method} ${req.path}`);
  console.log('� Content-Length:', req.headers['content-length'] || 'not set');
  console.log('📋 Content-Type:', req.headers['content-type'] || 'not set');
  console.time('upload-handling');
  
  // Store start time for later use
  req.uploadStartTime = Date.now();
  
  next();
});

// Apply auth middleware per route (better practice)
router.post('/recognize-details', 
  authMiddleware,           // ✅ Auth required
  upload.single('image'),   // ✅ Handle image upload
  (req, res, next) => {     // ✅ Log image reception and timing
    console.timeEnd('upload-handling');
    console.log('📷 Image received:', {
      filename: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      sizeInMB: req.file?.size ? (req.file.size / (1024 * 1024)).toFixed(2) : 'unknown',
      hasBuffer: !!req.file?.buffer,
      uploadDuration: `${Date.now() - req.uploadStartTime}ms`
    });
    console.log('👤 User ID:', res.locals.uid);
    next();
  },
  recognizeFoodDetails      // ✅ Process image
);

router.post('/barcode', 
  authMiddleware,           // ✅ Auth required
  recognizeBarcode
);

router.post('/add-food', 
  authMiddleware,           // ✅ Auth required
  addFood
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Camera route error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 20MB.' // ✅ Fixed to match actual limit
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name. Use "image" field.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed.'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;
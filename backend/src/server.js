const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Middleware to ensure JSON responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Health check route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Nutritor-AI backend is running 🚀" });
});


// Mount routers
app.use('/api/v1/home', require('./routes/homeRoutes'));
app.use('/api/v1/favorites', require('./routes/favoritesRoutes'));
app.use('/api/v1/camera', require('./routes/cameraRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/diet', require('./routes/dietRoutes'));
app.use('/api/v1/analysis', require('./routes/analysisRoutes'));
app.use('/api/v1/search', require('./routes/searchRoutes'));
app.use('/api/v1/foods', require('./routes/foodRoutes'));
app.use('/api/v1/profile', require('./routes/profileRoutes'));
app.use('/api/v1/password', require('./routes/passwordRoutes'));
app.use('/api/v1/chat', require('./routes/chatbotRoutes'));
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/nutrition', require('./routes/nutritionRoutes'));

// Catch-all handler for undefined routes - return JSON instead of HTML
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Initialize notification scheduler
const { initializeScheduler } = require('./utils/notificationScheduler');

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log('📱 Initializing notification scheduler...');
    
    // Initialize automatic notifications
    try {
      initializeScheduler();
      console.log('✅ Notification scheduler initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notification scheduler:', error);
    }
  }
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
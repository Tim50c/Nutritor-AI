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

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
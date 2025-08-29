const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  createNotification,
  sendNotification, 
  updatePreferences, 
  markAsRead,
  deleteNotification 
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all notifications for user
router.get('/', authMiddleware, getNotifications);

// Create a new notification (backend determines content)
router.post('/create', authMiddleware, createNotification);

// Send push notification (for future use)
router.post('/send', authMiddleware, sendNotification);

// Update notification preferences
router.patch('/preferences', authMiddleware, updatePreferences);

// Mark notification as read
router.patch('/:id/read', authMiddleware, markAsRead);

// Delete notification
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
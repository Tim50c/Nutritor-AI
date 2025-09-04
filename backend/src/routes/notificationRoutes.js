const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead,
  deleteNotification,
  updateNotificationPreferences,
  getNotificationPreferences,
  triggerNotification,
  sendTestNotificationController,
  sendManualNotification,
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all notifications for user
router.get('/', authMiddleware, getNotifications);

// Get notification preferences
router.get('/preferences', authMiddleware, getNotificationPreferences);

// Update notification preferences
router.patch('/preferences', authMiddleware, updateNotificationPreferences);

// Send test notification
router.post('/test', authMiddleware, sendTestNotificationController);

// Send manual notification
router.post('/send', authMiddleware, sendManualNotification);

// Mark notification as read
router.patch('/:id/read', authMiddleware, markAsRead);

// Delete notification
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
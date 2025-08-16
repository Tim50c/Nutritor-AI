const express = require('express');
const router = express.Router();
const { getNotifications, sendNotification, updatePreferences, deleteNotification } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getNotifications);
router.post('/send', authMiddleware, sendNotification);
router.patch('/preferences', authMiddleware, updatePreferences);
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
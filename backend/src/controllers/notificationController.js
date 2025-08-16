const { db } = require('../config/firebase');
const messaging = require('../config/fcm');
const Notification = require('../models/notificationModel');

// @desc    Get notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { uid } = res.locals;

    const notificationsSnapshot = await db.collection('users').doc(uid).collection('notifications').orderBy('createdAt', 'desc').get();
    const notifications = notificationsSnapshot.docs.map(doc => Notification.fromFirestore(doc));

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Send a push notification
// @route   POST /api/v1/notifications/send
// @access  Private
exports.sendNotification = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { token, title, body } = req.body;

    const message = {
      notification: {
        title,
        body
      },
      token
    };

    await messaging.send(message);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update notification preferences
// @route   PATCH /api/v1/notifications/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { preferences } = req.body;

    await db.collection('users').doc(uid).update({ notificationPreferences: preferences });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { id } = req.params;

    await db.collection('users').doc(uid).collection('notifications').doc(id).delete();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
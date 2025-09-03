const { db } = require('../config/firebase');
const messaging = require('../config/fcm');
const Notification = require('../models/notificationModel');

// Notification Templates - Backend decides what to send
const NotificationTemplates = {
  mealReminder: (mealType) => ({
    title: `🍽️ ${mealType} Reminder`,
    body: `Don't forget to log your ${mealType.toLowerCase()}!`,
    type: 'meal_reminder',
    data: { mealType }
  }),

  weeklyProgress: (progress) => ({
    title: "📊 Weekly Progress",
    body: `You're ${progress}% towards your weekly nutrition goals!`,
    type: 'weekly_progress',
    data: { progress }
  }),

  customMessage: (title, message, data = {}) => ({
    title,
    body: message,
    type: 'custom',
    data: { ...data }
  })
};

// @desc    Get notifications for a user
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    console.log(`📋 Fetching notifications for user: ${uid}`);

    const notificationsSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .get();
    
    const notifications = notificationsSnapshot.docs.map(doc => {
      const notification = Notification.fromFirestore(doc);
      return {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        message: `${notification.title}: ${notification.body}`, // Combined message for frontend
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt
      };
    });

    console.log(`✅ Found ${notifications.length} notifications for user ${uid}`);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create and store a notification for a user
// @route   POST /api/v1/notifications/create
// @access  Private
exports.createNotification = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { type, data = {} } = req.body;

    let notificationContent;

    // Backend determines the notification content based on type
    switch (type) {
      case 'meal_reminder':
        notificationContent = NotificationTemplates.mealReminder(data.mealType || 'Meal');
        break;
      case 'goal_achieved':
        notificationContent = NotificationTemplates.goalAchieved(data.goalName || 'Goal');
        break;
      case 'weekly_progress':
        notificationContent = NotificationTemplates.weeklyProgress(data.progress || 0);
        break;
      case 'hydration_reminder':
        notificationContent = NotificationTemplates.hydrationReminder();
        break;
      case 'custom':
        notificationContent = NotificationTemplates.customMessage(
          data.title || 'Nutritor AI',
          data.message || 'You have a new notification',
          data
        );
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid notification type' 
        });
    }

    // Create notification document
    const notification = new Notification(
      null, // id will be auto-generated
      notificationContent.title,
      notificationContent.body,
      notificationContent.data, // type parameter
      false, // read status (unread by default)
      new Date() // createdAt
    );

    // Store in Firestore
    const docRef = await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .add(notification.toFirestore());

    res.status(201).json({ 
      success: true, 
      data: { 
        id: docRef.id, 
        ...notification.toFirestore(),
        message: `${notificationContent.title}: ${notificationContent.body}`
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Send a push notification (for future use)
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

    await db
      .collection('users')
      .doc(uid)
      .update({ notificationPreferences: preferences });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { id } = req.params;

    await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .doc(id)
      .update({ read: true, readAt: new Date() });

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

    await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .doc(id)
      .delete();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Trigger notifications based on user activity (called by other controllers)
// @route   Used internally by other controllers
// @access  Internal
exports.triggerNotification = async (uid, type, data = {}) => {
  try {
    let notificationContent;

    // Backend logic determines what notification to create
    switch (type) {
      case 'meal_reminder':
        notificationContent = NotificationTemplates.mealReminder(data.mealType || 'Meal');
        break;
      case 'goal_achieved':
        notificationContent = NotificationTemplates.goalAchieved(data.goalName || 'Goal');
        break;
      case 'weekly_progress':
        notificationContent = NotificationTemplates.weeklyProgress(data.progress || 0);
        break;
      case 'hydration_reminder':
        notificationContent = NotificationTemplates.hydrationReminder();
        break;
      case 'custom':
        notificationContent = NotificationTemplates.customMessage(
          data.title || 'Nutritor AI',
          data.message || 'You have a new notification',
          data
        );
        break;
      default:
        console.log('Invalid notification type:', type);
        return false;
    }

    // Create notification document
    const notification = new Notification(
      null,
      notificationContent.title,
      notificationContent.body,
      notificationContent.data,
      new Date(),
      false
    );

    // Store in Firestore
    await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .add(notification.toFirestore());

    console.log(`✅ Notification created for user ${uid}: ${notificationContent.title}`);
    return true;
  } catch (error) {
    console.error('Error triggering notification:', error);
    return false;
  }
};
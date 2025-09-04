const { db } = require('../config/firebase');
const { sendNotificationToUser, sendTestNotification } = require('../utils/notificationHelpers');
const { sendExpoPushNotification } = require('../utils/expoPushNotifications');
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

// @desc Get notifications for a user
// @route GET /api/v1/notifications
// @access Private
const getNotifications = async (req, res, next) => {
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
        message: `${notification.title}: ${notification.body}`,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt
      };
    });

    console.log(`✅ Found ${notifications.length} notifications for user ${uid}`);
    return res.status(200).json({ success: true, data: notifications }); // ✅ ADDED return
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return res.status(500).json({ success: false, error: 'Server error' }); // ✅ ADDED return
  }
};

// @desc Create and store a notification for a user
// @route POST /api/v1/notifications/create
// @access Private
const createNotification = async (req, res, next) => { // ✅ FIXED: Changed exports.createNotification to const createNotification
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
      null,
      notificationContent.title,
      notificationContent.body,
      notificationContent.data,
      false,
      new Date()
    );

    // Store in Firestore
    const docRef = await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .add(notification.toFirestore());

    return res.status(201).json({ // ✅ ADDED return
      success: true,
      data: {
        id: docRef.id,
        ...notification.toFirestore(),
        message: `${notificationContent.title}: ${notificationContent.body}`
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' }); // ✅ ADDED return
  }
};

// @desc Send a push notification (for future use)
// @route POST /api/v1/notifications/send
// @access Private
const sendNotification = async (req, res, next) => { // ✅ FIXED: Changed exports.sendNotification to const sendNotification
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
    return res.status(200).json({ success: true, data: {} }); // ✅ ADDED return
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' }); // ✅ ADDED return
  }
};

// ✅ MAIN FIX: Update notification preferences
// @route PATCH /api/v1/notifications/preferences
// @access Private
const updateNotificationPreferences = async (req, res, next) => {
  try {
    const uid = res.locals.uid || req.user?.uid;
    
    if (!uid) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { mealReminders, weeklyProgress, goalAchievements } = req.body;
    const preferences = {};

    // ✅ FIXED: Helper function to validate time object with hour and minute
    const validateTime = (time) => {
      if (!time || typeof time !== 'object') {
        return false;
      }
      const { hour, minute } = time;
      return (
        typeof hour === 'number' && 
        typeof minute === 'number' && 
        hour >= 0 && hour <= 23 && 
        minute >= 0 && minute <= 59
      );
    };

    // ✅ FIXED: Validate meal reminders - REMOVED forEach loop
    if (mealReminders) {
      if (typeof mealReminders !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Invalid mealReminders format'
        });
      }

      // ✅ FIXED: Use for...of loop instead of forEach to allow proper returns
      const meals = ['breakfast', 'lunch', 'dinner'];
      for (const meal of meals) {
        if (mealReminders[meal] && typeof mealReminders[meal].time !== 'undefined') {
          if (!validateTime(mealReminders[meal].time)) {
            return res.status(400).json({
              success: false,
              message: `Invalid time format for ${meal}. Expected object with hour (0-23) and minute (0-59).`
            });
          }
        }
      }
      preferences.mealReminders = mealReminders;
    }

    // ✅ FIXED: Validate weekly progress
    if (weeklyProgress) {
      if (typeof weeklyProgress.time !== 'undefined' && !validateTime(weeklyProgress.time)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format for weeklyProgress. Expected object with hour (0-23) and minute (0-59).'
        });
      }
      preferences.weeklyProgress = weeklyProgress;
    }

    // ✅ FIXED: Validate goal achievements
    if (goalAchievements) {
      if (typeof goalAchievements.time !== 'undefined' && !validateTime(goalAchievements.time)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format for goalAchievements. Expected object with hour (0-23) and minute (0-59).'
        });
      }
      preferences.goalAchievements = goalAchievements;
    }

    // Update user document with new preferences
    await db.collection('users').doc(uid).update({
      notificationPreferences: preferences,
      updatedAt: new Date()
    });

    console.log(`✅ Updated notification preferences for user: ${uid}`);
    console.log('📋 New preferences:', JSON.stringify(preferences, null, 2));

    return res.status(200).json({ // ✅ ADDED return
      success: true,
      message: 'Notification preferences updated successfully',
      data: { preferences }
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({ // ✅ ADDED return
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

// @desc Get notification preferences
// @route GET /api/v1/notifications/preferences
// @access Private
const getNotificationPreferences = async (req, res, next) => {
  try {
    const uid = res.locals.uid || req.user?.uid;
    
    if (!uid) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    // Return preferences with hour and minute objects
    const preferences = userData.notificationPreferences || {
      mealReminders: {
        enabled: true,
        breakfast: {
          enabled: true,
          time: { hour: 8, minute: 0 },
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        lunch: {
          enabled: true,
          time: { hour: 12, minute: 0 },
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        dinner: {
          enabled: true,
          time: { hour: 18, minute: 0 },
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }
      },
      weeklyProgress: {
        enabled: true,
        time: { hour: 9, minute: 0 },
        day: 'sunday'
      },
      goalAchievements: {
        enabled: false,
        time: { hour: 21, minute: 0 },
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }
    };

    return res.status(200).json({ // ✅ ADDED return
      success: true,
      data: { preferences }
    });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return res.status(500).json({ // ✅ ADDED return
      success: false,
      message: 'Failed to get notification preferences',
      error: error.message
    });
  }
};

// @desc Mark notification as read
// @route PATCH /api/v1/notifications/:id/read
// @access Private
const markAsRead = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { id } = req.params;

    await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .doc(id)
      .update({ read: true, readAt: new Date() });

    return res.status(200).json({ success: true, data: {} }); // ✅ ADDED return
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' }); // ✅ ADDED return
  }
};

// @desc Delete a notification
// @route DELETE /api/v1/notifications/:id
// @access Private
const deleteNotification = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { id } = req.params;

    await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .doc(id)
      .delete();

    return res.status(200).json({ success: true, data: {} }); // ✅ ADDED return
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' }); // ✅ ADDED return
  }
};

// @desc Trigger notifications based on user activity (called by other controllers)
// @route Used internally by other controllers
// @access Internal
const triggerNotification = async (uid, type, data = {}) => {
  try {
    let notificationContent;

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

    const notification = new Notification(
      null,
      notificationContent.title,
      notificationContent.body,
      notificationContent.data,
      new Date(),
      false
    );

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

// @desc Send test notification
// @route POST /api/v1/notifications/test
// @access Private
const sendTestNotificationController = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { title, body, type } = req.body;

    const notificationData = {
      title: title || '🧪 Test Notification',
      body: body || 'This is a test notification from Nutritor AI!',
      type: type || { testType: 'manual' },
    };

    const notificationId = await sendNotificationToUser(uid, notificationData);

    return res.status(200).json({ // ✅ ADDED return
      success: true,
      message: 'Test notification sent successfully',
      data: {
        notificationId,
        notification: notificationData,
      },
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return res.status(500).json({ // ✅ ADDED return
      success: false,
      message: 'Failed to send test notification',
      error: error.message,
    });
  }
};

// @desc Send manual notification to user
// @route POST /api/v1/notifications/send
// @access Private
const sendManualNotification = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { title, body, type } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    const notificationData = {
      title,
      body,
      type: type || { manualType: 'user_created' },
    };

    const notificationId = await sendNotificationToUser(uid, notificationData);

    return res.status(200).json({ // ✅ ADDED return
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId,
        notification: notificationData,
      },
    });
  } catch (error) {
    console.error('Error sending manual notification:', error);
    return res.status(500).json({ // ✅ ADDED return
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  createNotification, // ✅ ADDED missing export
  sendNotification, // ✅ ADDED missing export
  markAsRead,
  deleteNotification,
  updateNotificationPreferences,
  getNotificationPreferences,
  triggerNotification,
  sendTestNotificationController,
  sendManualNotification,
};
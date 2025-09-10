// backend/src/utils/notificationHelpers.js
const { db, admin } = require('../config/firebase');
const { sendExpoPushNotification } = require('./expoPushNotifications');

/**
 * Send notification to user based on platform
 * @param {string} uid - User ID
 * @param {object} notificationData - Notification content
 * @returns {Promise<string>} - Notification ID
 */
const sendNotificationToUser = async (uid, notificationData) => {
  try {
    // Get user's platform and tokens
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const platform = userData?.platform;
    const fcmToken = userData?.fcmToken;
    const expoPushToken = userData?.expoPushToken;

    // Always save to Firestore for both platforms (for notification history)
    const notificationRef = await db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .add({
        ...notificationData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

    console.log('✅ Notification saved to Firestore for user:', uid);

    // Send push notification based on available tokens
    if (expoPushToken) {
      // Send Expo push notification (works for both iOS and Android with Expo)
      try {
        await sendExpoPushNotification(
          expoPushToken,
          notificationData.title,
          notificationData.body,
          {
            type: notificationData.type,
            notificationId: notificationRef.id,
          }
        );
        console.log('✅ Expo push notification sent to user:', uid);
      } catch (expoError) {
        console.error('❌ Error sending Expo push notification:', expoError);
      }
    } else if (platform === 'android' && fcmToken) {
      // Fallback to FCM for Android (if using bare React Native)
      try {
        const message = {
          notification: {
            title: notificationData.title,
            body: notificationData.body,
          },
          data: {
            type: JSON.stringify(notificationData.type),
            notificationId: notificationRef.id,
          },
          token: fcmToken,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        };

        const response = await admin.messaging().send(message);
        console.log('✅ FCM notification sent to Android user:', response);
      } catch (fcmError) {
        console.error('❌ Error sending FCM notification:', fcmError);
      }
    } else {
      console.log('📱 User will receive notification via Firestore listener (no push token available)');
    }

    return notificationRef.id;
  } catch (error) {
    console.error('❌ Error sending notification to user:', error);
    throw error;
  }
};

/**
 * Create meal reminder notification
 * @param {string} uid - User ID
 * @param {string} mealType - breakfast, lunch, dinner
 * @returns {Promise<string>} - Notification ID
 */
const createMealReminder = async (uid, mealType) => {
  const mealEmojis = {
    breakfast: '🍳',
    lunch: '🥗',
    dinner: '🍽️'
  };

  const notification = {
    title: `${mealEmojis[mealType] || '🍽️'} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Time!`,
    body: `Don't forget to log your ${mealType.toLowerCase()}!`,
    type: { mealType: mealType },
  };
  
  return await sendNotificationToUser(uid, notification);
};

/**
 * Create weekly progress notification
 * @param {string} uid - User ID
 * @param {number} progress - Progress percentage
 * @returns {Promise<string>} - Notification ID
 */
const createWeeklyProgress = async (uid, progress) => {
  const notification = {
    title: '📊 Weekly Progress Report',
    body: `You've achieved ${progress}% of your nutrition goals this week! Don't forget to log your current weight!`,
    type: { progressType: 'weekly', progress: progress },
  };
  
  return await sendNotificationToUser(uid, notification);
};

/**
 * Create goal achievement notification
 * @param {string} uid - User ID
 * @param {string} goalType - calories, protein, etc.
 * @param {number} value - Achievement value
 * @returns {Promise<string>} - Notification ID
 */
const createGoalAchievement = async (uid, goalType, value) => {
  const notification = {
    title: '🎉 Goal Achieved!',
    body: `Congratulations! You reached your daily ${goalType} goal of ${value}!`,
    type: { achievementType: goalType, value: value },
  };
  
  return await sendNotificationToUser(uid, notification);
};

module.exports = {
  sendNotificationToUser,
  createMealReminder,
  createWeeklyProgress,
  createGoalAchievement,
};

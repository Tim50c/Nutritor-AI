const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification via Expo
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send
 * @returns {Promise} - Expo ticket
 */
const sendExpoPushNotification = async (pushToken, title, body, data = {}) => {
  try {
    // Check that the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`❌ Push token ${pushToken} is not a valid Expo push token`);
      return null;
    }

    // Construct the message
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: 'default',
    };

    console.log('📤 Sending Expo push notification:', { title, body, to: pushToken.substring(0, 20) + '...' });

    // Send the notification
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log('✅ Expo push notification sent:', tickets[0]);
    
    return tickets[0];
  } catch (error) {
    console.error('❌ Error sending Expo push notification:', error);
    throw error;
  }
};

/**
 * Send push notifications to multiple tokens
 * @param {Array} messages - Array of message objects
 * @returns {Promise} - Array of Expo tickets
 */
const sendExpoPushNotificationsBatch = async (messages) => {
  try {
    // Filter out invalid tokens
    const validMessages = messages.filter(message => {
      if (!Expo.isExpoPushToken(message.to)) {
        console.error(`❌ Invalid push token: ${message.to}`);
        return false;
      }
      return true;
    });

    if (validMessages.length === 0) {
      console.warn('⚠️ No valid push tokens found');
      return [];
    }

    console.log(`📤 Sending ${validMessages.length} Expo push notifications`);

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(validMessages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Error sending notification chunk:', error);
      }
    }

    console.log(`✅ Sent ${tickets.length} Expo push notifications`);
    return tickets;
  } catch (error) {
    console.error('❌ Error sending batch push notifications:', error);
    throw error;
  }
};

module.exports = {
  sendExpoPushNotification,
  sendExpoPushNotificationsBatch,
};

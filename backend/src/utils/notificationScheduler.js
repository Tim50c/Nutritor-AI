// backend/src/utils/notificationScheduler.js
const cron = require('node-cron');
const { db } = require('../config/firebase');
const { createMealReminder, createWeeklyProgress, createGoalAchievement } = require('./notificationHelpers');

/**
 * Get all users who have meal reminders enabled
 */
const getUsersWithMealReminders = async () => {
  try {
    const usersSnapshot = await db.collection('users')
      .where('notificationPreferences.mealReminders.enabled', '==', true)
      .get();
    
    return usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users with meal reminders:', error);
    return [];
  }
};

/**
 * Check if user wants meal reminder for specific meal and day
 */
const shouldSendMealReminder = (user, mealType, currentDay, currentHour) => {
  const preferences = user.notificationPreferences?.mealReminders;
  
  if (!preferences?.enabled) return false;
  
  // Check if this meal type is enabled
  if (!preferences[mealType]?.enabled) return false;
  
  // Check if today is in allowed days
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[currentDay];
  
  if (!preferences[mealType].days?.includes(todayName)) return false;
  
  // Check if current hour matches the scheduled time
  const scheduledHour = preferences[mealType].time || getDefaultMealTime(mealType);
  
  return currentHour === scheduledHour;
};

/**
 * Get default meal times
 */
const getDefaultMealTime = (mealType) => {
  const defaults = {
    breakfast: 8,
    lunch: 12,
    dinner: 18
  };
  return defaults[mealType] || 12;
};

/**
 * Calculate user's weekly progress
 */
const calculateWeeklyProgress = async (uid) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Get user's diet entries from the past week
    const dietSnapshot = await db.collection('users')
      .doc(uid)
      .collection('diets')
      .where('createdAt', '>=', oneWeekAgo)
      .get();
    
    const totalDays = 7;
    const daysWithEntries = new Set();
    
    dietSnapshot.docs.forEach(doc => {
      const date = doc.data().createdAt.toDate();
      const dayKey = date.toDateString();
      daysWithEntries.add(dayKey);
    });
    
    const progress = Math.round((daysWithEntries.size / totalDays) * 100);
    return Math.min(progress, 100); // Cap at 100%
  } catch (error) {
    console.error('Error calculating weekly progress:', error);
    return 0;
  }
};

/**
 * Check if user achieved daily goals
 */
const checkDailyGoals = async (uid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's diet entries
    const dietSnapshot = await db.collection('users')
      .doc(uid)
      .collection('diets')
      .where('createdAt', '>=', today)
      .where('createdAt', '<', tomorrow)
      .get();
    
    // Get user's target nutrition
    const userDoc = await db.collection('users').doc(uid).get();
    const targetNutrition = userDoc.data()?.targetNutrition;
    
    if (!targetNutrition) return null;
    
    // Calculate total nutrition for today
    let totalCalories = 0;
    let totalProtein = 0;
    
    dietSnapshot.docs.forEach(doc => {
      const dietData = doc.data();
      if (dietData.foods && Array.isArray(dietData.foods)) {
        dietData.foods.forEach(food => {
          if (food.nutrition) {
            totalCalories += food.nutrition.cal || 0;
            totalProtein += food.nutrition.protein || 0;
          }
        });
      }
    });
    
    const achievements = [];
    
    // Check calorie goal
    if (totalCalories >= targetNutrition.calories && targetNutrition.calories > 0) {
      achievements.push({
        type: 'calories',
        value: targetNutrition.calories,
        achieved: totalCalories
      });
    }
    
    // Check protein goal
    if (totalProtein >= targetNutrition.protein && targetNutrition.protein > 0) {
      achievements.push({
        type: 'protein',
        value: targetNutrition.protein,
        achieved: totalProtein
      });
    }
    
    return achievements;
  } catch (error) {
    console.error('Error checking daily goals:', error);
    return [];
  }
};

/**
 * Trigger meal reminder notifications
 */
const triggerMealReminders = async () => {
  try {
    console.log('🕐 Checking for meal reminder notifications...');
    const users = await getUsersWithMealReminders();
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    let totalSent = 0;
    
    for (const user of users) {
      for (const mealType of mealTypes) {
        if (shouldSendMealReminder(user, mealType, currentDay, currentHour)) {
          try {
            await createMealReminder(user.uid, mealType);
            console.log(`✅ ${mealType} reminder sent to user: ${user.uid}`);
            totalSent++;
          } catch (error) {
            console.error(`❌ Failed to send ${mealType} reminder to user ${user.uid}:`, error);
          }
        }
      }
    }
    
    if (totalSent > 0) {
      console.log(`📱 Sent ${totalSent} meal reminders to users`);
    }
  } catch (error) {
    console.error('❌ Error triggering meal reminders:', error);
  }
};

/**
 * Check if user wants weekly progress notification
 */
const shouldSendWeeklyProgress = (user, currentDay, currentHour) => {
  const preferences = user.notificationPreferences?.weeklyProgress;
  
  if (!preferences?.enabled) return false;
  
  // Check if today is the scheduled day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[currentDay];
  
  if (preferences.day !== todayName) return false;
  
  // Check if current hour matches the scheduled time
  const scheduledHour = preferences.time || 9; // Default to 9 AM
  
  return currentHour === scheduledHour;
};

/**
 * Trigger weekly progress notifications
 */
const triggerWeeklyProgress = async () => {
  try {
    console.log('📊 Checking for weekly progress notifications...');
    const usersSnapshot = await db.collection('users').get();
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    let totalSent = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      
      if (shouldSendWeeklyProgress(userData, currentDay, currentHour)) {
        try {
          const progress = await calculateWeeklyProgress(uid);
          await createWeeklyProgress(uid, progress);
          console.log(`✅ Weekly progress notification sent to user: ${uid} (${progress}%)`);
          totalSent++;
        } catch (error) {
          console.error(`❌ Failed to send weekly progress to user ${uid}:`, error);
        }
      }
    }
    
    if (totalSent > 0) {
      console.log(`📊 Sent ${totalSent} weekly progress notifications`);
    }
  } catch (error) {
    console.error('❌ Error triggering weekly progress:', error);
  }
};

/**
 * Check if user wants goal achievement notification
 */
const shouldSendGoalAchievement = (user, currentDay, currentHour) => {
  const preferences = user.notificationPreferences?.goalAchievements;
  
  if (!preferences?.enabled) return false;
  
  // Check if today is in allowed days
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[currentDay];
  
  if (!preferences.days?.includes(todayName)) return false;
  
  // Check if current hour matches the scheduled time
  const scheduledHour = preferences.time || 21; // Default to 9 PM
  
  return currentHour === scheduledHour;
};

/**
 * Check and notify goal achievements
 */
const checkGoalAchievements = async () => {
  try {
    console.log('🎯 Checking for goal achievement notifications...');
    const usersSnapshot = await db.collection('users').get();
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    let totalSent = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      
      if (shouldSendGoalAchievement(userData, currentDay, currentHour)) {
        try {
          const achievements = await checkDailyGoals(uid);
          
          if (achievements && achievements.length > 0) {
            for (const achievement of achievements) {
              await createGoalAchievement(uid, achievement.type, achievement.value);
              console.log(`🎉 Goal achievement notification sent to user: ${uid} (${achievement.type})`);
              totalSent++;
            }
          }
        } catch (error) {
          console.error(`❌ Failed to check goals for user ${uid}:`, error);
        }
      }
    }
    
    if (totalSent > 0) {
      console.log(`🎯 Sent ${totalSent} goal achievement notifications`);
    }
  } catch (error) {
    console.error('❌ Error checking goal achievements:', error);
  }
};

/**
 * Initialize notification scheduler
 */
const initializeScheduler = () => {
  console.log('🕐 Initializing notification scheduler...');
  
  // Schedule all notifications to run every hour
  // The functions will check user preferences for specific times and days
  cron.schedule('0 * * * *', () => {
    triggerMealReminders();
    triggerWeeklyProgress();
    checkGoalAchievements();
  });
  
  console.log('✅ Notification scheduler initialized');
  console.log('📅 All notifications: Checked every hour based on user preferences');
  console.log('📱 Meal reminders: User-configurable times and days');
  console.log('� Weekly progress: User-configurable day and time');
  console.log('🎯 Goal achievements: User-configurable days and time');
};

/**
 * Send test notification to a specific user (for testing)
 * @param {string} uid - User ID
 * @returns {Promise<string>} - Notification ID
 */
const sendTestNotification = async (uid) => {
  try {
    const { sendNotificationToUser } = require('./notificationHelpers');
    
    const testNotification = {
      title: '🧪 Test Notification',
      body: 'This is a test notification from Nutritor AI!',
      type: { testType: 'manual_test' },
    };
    
    const notificationId = await sendNotificationToUser(uid, testNotification);
    console.log(`✅ Test notification sent to user ${uid}: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    throw error;
  }
};

module.exports = {
  initializeScheduler,
  triggerMealReminders,
  triggerWeeklyProgress,
  checkGoalAchievements,
  sendTestNotification,
};

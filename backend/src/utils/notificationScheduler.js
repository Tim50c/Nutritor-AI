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
      .where('notificationPreferences.mealReminders', '==', true)
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
    const currentHour = new Date().getHours();
    
    let mealType = null;
    if (currentHour === 8) mealType = 'breakfast';
    else if (currentHour === 12) mealType = 'lunch';
    else if (currentHour === 18) mealType = 'dinner';
    
    if (mealType) {
      console.log(`📱 Sending ${mealType} reminders to ${users.length} users`);
      
      for (const user of users) {
        try {
          await createMealReminder(user.uid, mealType);
          console.log(`✅ ${mealType} reminder sent to user: ${user.uid}`);
        } catch (error) {
          console.error(`❌ Failed to send ${mealType} reminder to user ${user.uid}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error triggering meal reminders:', error);
  }
};

/**
 * Trigger weekly progress notifications
 */
const triggerWeeklyProgress = async () => {
  try {
    console.log('📊 Sending weekly progress notifications...');
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      
      try {
        const progress = await calculateWeeklyProgress(uid);
        await createWeeklyProgress(uid, progress);
        console.log(`✅ Weekly progress notification sent to user: ${uid} (${progress}%)`);
      } catch (error) {
        console.error(`❌ Failed to send weekly progress to user ${uid}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error triggering weekly progress:', error);
  }
};

/**
 * Check and notify goal achievements
 */
const checkGoalAchievements = async () => {
  try {
    console.log('🎯 Checking for goal achievements...');
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      
      try {
        const achievements = await checkDailyGoals(uid);
        
        if (achievements && achievements.length > 0) {
          for (const achievement of achievements) {
            await createGoalAchievement(uid, achievement.type, achievement.value);
            console.log(`🎉 Goal achievement notification sent to user: ${uid} (${achievement.type})`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to check goals for user ${uid}:`, error);
      }
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
  
  // Schedule meal reminders every hour
  cron.schedule('0 * * * *', () => {
    triggerMealReminders();
  });
  
  // Schedule weekly progress every Sunday at 9 AM
  cron.schedule('0 9 * * 0', () => {
    triggerWeeklyProgress();
  });
  
  // Schedule goal achievement checks every day at 9 PM
  cron.schedule('0 21 * * *', () => {
    checkGoalAchievements();
  });
  
  console.log('✅ Notification scheduler initialized');
  console.log('📅 Meal reminders: Every hour (8 AM, 12 PM, 6 PM)');
  console.log('📅 Weekly progress: Sundays at 9 AM');
  console.log('📅 Goal achievements: Daily at 9 PM');
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

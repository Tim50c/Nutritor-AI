// backend/src/utils/notificationScheduler.js


const cron = require('node-cron');
const { db } = require('../config/firebase');
const { createMealReminder, createWeeklyProgress, createGoalAchievement } = require('./notificationHelpers');

/**
 * Get Bangkok time properly
 */
const getBangkokTime = () => {
  const utcNow = new Date();
  const bangkokTime = new Date(utcNow.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
  return bangkokTime;
};

/**
 * Get all users who have meal reminders enabled
 */
const getUsersWithMealReminders = async () => {
  try {
    const usersSnapshot = await db.collection('users').get();
    return usersSnapshot.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter(user => user.notificationPreferences?.mealReminders?.enabled === true);
  } catch (error) {
    console.error('Error getting users with meal reminders:', error);
    return [];
  }
};

/**
 * Check if user wants meal reminder for specific meal and day
 */
const shouldSendMealReminder = (user, mealType, currentDay, currentHour, currentMinute) => {
  console.log(`🔍 Checking ${mealType} for user ${user.uid}:`);
  
  const preferences = user.notificationPreferences?.mealReminders;
  if (!preferences?.enabled) {
    console.log(`❌ Meal reminders not enabled`);
    return false;
  }
  
  if (!preferences[mealType]?.enabled) {
    console.log(`❌ ${mealType} not enabled`);
    return false;
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[currentDay];
  console.log(`📅 Today is: ${todayName} (${currentDay})`);
  
  const mealDays = preferences[mealType].days;
  console.log(`📋 ${mealType} days:`, mealDays);
  
  if (!mealDays?.includes(todayName)) {
    console.log(`❌ ${todayName} not in ${mealType} days`);
    return false;
  }

  const timeObj = preferences[mealType].time;
  console.log(`⏰ ${mealType} time: ${timeObj?.hour}:${timeObj?.minute}, Current: ${currentHour}:${currentMinute}`);
  
  if (typeof timeObj === 'object' && timeObj.hour !== undefined) {
    const match = currentHour === timeObj.hour && currentMinute === timeObj.minute;
    console.log(`✅ Time match: ${match}`);
    return match;
  }

  return false;
};

/**
 * Calculate user's weekly progress
 */
const calculateWeeklyProgress = async (uid) => {
  try {
    const bangkokNow = getBangkokTime();
    const oneWeekAgo = new Date(bangkokNow);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);


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
    return Math.min(progress, 100);
    return Math.min(progress, 100);
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
    const bangkokNow = getBangkokTime();
    const today = new Date(bangkokNow);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);


    const dietSnapshot = await db.collection('users')
      .doc(uid)
      .collection('diets')
      .where('createdAt', '>=', today)
      .where('createdAt', '<', tomorrow)
      .get();


    const userDoc = await db.collection('users').doc(uid).get();
    const targetNutrition = userDoc.data()?.targetNutrition;
    if (!targetNutrition) return null;


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


    if (totalCalories >= targetNutrition.calories && targetNutrition.calories > 0) {
      achievements.push({
        type: 'calories',
        value: targetNutrition.calories,
        achieved: totalCalories
      });
    }


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
    const now = getBangkokTime();

    const users = await getUsersWithMealReminders();
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    const mealTypes = ['breakfast', 'lunch', 'dinner'];

    let totalSent = 0;

    for (const user of users) {      
      for (const mealType of mealTypes) {
        if (shouldSendMealReminder(user, mealType, currentDay, currentHour, currentMinute)) {
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
  } catch (error) {
    console.error('❌ Error triggering meal reminders:', error);
  }
};

/**
 * Check if user wants weekly progress notification
 */
const shouldSendWeeklyProgress = (user, currentDay, currentHour, currentMinute) => {
  const preferences = user.notificationPreferences?.weeklyProgress;
  if (!preferences?.enabled) return false;


  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[currentDay];
  if (preferences.day !== todayName) return false;


  const timeObj = preferences.time;
  if (typeof timeObj === 'object' && timeObj.hour !== undefined) {
    return currentHour === timeObj.hour && currentMinute === timeObj.minute;
  }


  return false;
};

/**
 * Trigger weekly progress notifications
 */
const triggerWeeklyProgress = async () => {
  try {
    const usersSnapshot = await db.collection('users').get();
    
    const now = getBangkokTime();
    
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let totalSent = 0;


    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();


      if (shouldSendWeeklyProgress(userData, currentDay, currentHour, currentMinute)) {
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
  } catch (error) {
    console.error('❌ Error triggering weekly progress:', error);
  }
};

/**
 * Check if user wants goal achievement notification
 */
const shouldSendGoalAchievement = (user, currentDay, currentHour, currentMinute) => {
  const preferences = user.notificationPreferences?.goalAchievements;
  if (!preferences?.enabled) return false;


  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[currentDay];
  if (!preferences.days?.includes(todayName)) return false;


  const timeObj = preferences.time;
  if (typeof timeObj === 'object' && timeObj.hour !== undefined && timeObj.minute !== undefined) {
    return currentHour === timeObj.hour && currentMinute === timeObj.minute;
  }


  return false;
};

/**
 * Check and notify goal achievements
 */
const checkGoalAchievements = async () => {
  try {
    const usersSnapshot = await db.collection('users').get();

    const now = getBangkokTime();
    
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();


    let totalSent = 0;


    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      if (shouldSendGoalAchievement(userData, currentDay, currentHour, currentMinute)) {
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
  } catch (error) {
    console.error('❌ Error checking goal achievements:', error);
  }
};

/**
 * Initialize notification scheduler
 */
const initializeScheduler = () => {
  console.log('🕐 Initializing notification scheduler...');
  
  // Schedule all notifications to run every minute
  // Schedule all notifications to run every minute
  cron.schedule('* * * * *', async () => {
    await triggerMealReminders();
    await triggerWeeklyProgress();
    await checkGoalAchievements();
  });


  console.log('✅ Notification scheduler initialized');
  console.log('📅 All notifications: Checked every minute with Bangkok timezone');
  console.log('📅 All notifications: Checked every minute with Bangkok timezone');
  console.log('📱 Meal reminders: User-configurable times and days');
  console.log('📊 Weekly progress: User-configurable day and time');
  console.log('🎯 Goal achievements: User-configurable days and time');
};

/**
 * Send test notification to a specific user (for testing)
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

const { db, admin } = require('../config/firebase');
const Diet = require('../models/dietModel');
const Food = require('../models/foodModel');
const { getNutritionForDates } = require('../utils/dietHelper');

// Helper function for timezone-safe date formatting
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc Get daily nutrition for 7 days of a week
// @route GET /api/v1/diet/nutrition/daily?startDate=YYYY-MM-DD
// @access Private
exports.getDailyNutrition = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { startDate } = req.query;

    // If no startDate provided, use current week (starting from Monday)
    let start;
    if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      // Parse date safely to avoid timezone shifts
      // Create date using local timezone components instead of Date constructor
      const [year, month, day] = startDate.split('-').map(Number);
      start = new Date(year, month - 1, day); // month is 0-indexed in JS
    } else {
      // Get current week starting from Monday
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days to Monday
      start = new Date(now);
      start.setDate(now.getDate() + mondayOffset);
    }

    console.log(`📅 Daily Nutrition Debug:`, {
      originalDate: startDate,
      calculatedStart: getLocalDateString(start),
      dayOfWeek: start.getDay(), // Should be 1 (Monday)
      today: getLocalDateString(new Date())
    });

    // Generate 7 days starting from the start date (Monday to Sunday)
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(getLocalDateString(date));
    }

    console.log(`📅 Generated dates (Mon-Sun):`, dates);

    const dailyNutritionArray = await getNutritionForDates(uid, dates);

    console.log(`📊 Raw nutrition data:`, dailyNutritionArray.map(d => ({
      date: d.date,
      calories: d.totalNutrition.calories
    })));

    // Calculate weekly total
    const weeklyTotal = dailyNutritionArray.reduce((acc, day) => ({
      calories: acc.calories + day.totalNutrition.calories,
      protein: Math.round((acc.protein + day.totalNutrition.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + day.totalNutrition.carbs) * 10) / 10,
      fat: Math.round((acc.fat + day.totalNutrition.fat) * 10) / 10
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    res.status(200).json({
      success: true,
      data: {
        weekPeriod: `${dates[0]} to ${dates[6]}`,
        dailyNutritionArray,
        weeklyTotal
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc Get weekly nutrition for latest 7 weeks
// @route GET /api/v1/diet/nutrition/weekly
// @access Private
exports.getWeeklyNutrition = async (req, res, next) => {
  try {
    const { uid } = res.locals;

    const weeklyData = [];
    const today = new Date();

    // Get data for the latest 7 weeks
    for (let weekIndex = 6; weekIndex >= 0; weekIndex--) {
      // Calculate start of each week (Monday)
      const weekStart = new Date(today);
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(today.getDate() + mondayOffset - (weekIndex * 7));

      // Generate 7 days for this week
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        weekDates.push(getLocalDateString(date));
      }

      // Get nutrition data for all days in this week
      const weekNutritionArray = await getNutritionForDates(uid, weekDates);

      // Calculate week total
      const weekTotal = weekNutritionArray.reduce((acc, day) => ({
        calories: acc.calories + day.totalNutrition.calories,
        protein: Math.round((acc.protein + day.totalNutrition.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + day.totalNutrition.carbs) * 10) / 10,
        fat: Math.round((acc.fat + day.totalNutrition.fat) * 10) / 10
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      weeklyData.push({
        week: `${weekDates[0]} to ${weekDates[6]}`,
        weekTotal,
        dailyBreakdown: weekNutritionArray
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: 'Latest 7 weeks',
        weeklyData
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc Get monthly nutrition for latest 12 months
// @route GET /api/v1/diet/nutrition/monthly
// @access Private
exports.getMonthlyNutrition = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlyData = [];

    // Get data for the latest 12 months
    for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
      const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      // Generate all dates for this month
      const daysInMonth = new Date(year, month, 0).getDate();
      const monthDates = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        monthDates.push(dateStr);
      }

      // Get nutrition data for all days in this month
      const monthNutritionArray = await getNutritionForDates(uid, monthDates);

      // Calculate month total
      const monthTotal = monthNutritionArray.reduce((acc, day) => ({
        calories: acc.calories + day.totalNutrition.calories,
        protein: Math.round((acc.protein + day.totalNutrition.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + day.totalNutrition.carbs) * 10) / 10,
        fat: Math.round((acc.fat + day.totalNutrition.fat) * 10) / 10
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      // Calculate days with data for averaging
      const daysWithData = monthNutritionArray.filter(day => 
        day.totalNutrition.calories > 0 || 
        day.totalNutrition.protein > 0 || 
        day.totalNutrition.carbs > 0 || 
        day.totalNutrition.fat > 0
      ).length;

      const monthAverage = daysWithData > 0 ? {
        calories: Math.round(monthTotal.calories / daysWithData),
        protein: Math.round((monthTotal.protein / daysWithData) * 10) / 10,
        carbs: Math.round((monthTotal.carbs / daysWithData) * 10) / 10,
        fat: Math.round((monthTotal.fat / daysWithData) * 10) / 10
      } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      monthlyData.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        monthTotal,
        monthAverage,
        daysWithData,
        totalDaysInMonth: daysInMonth
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: 'Latest 12 months',
        monthlyData
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get diet for a specific date with detailed food information
// @route   GET /api/v1/diet
// @access  Private
exports.getDiet = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Date parameter is required (format: YYYY-MM-DD)' 
      });
    }

    const dietDoc = await db.collection('users').doc(uid).collection('diets').doc(date).get();
    
    if (!dietDoc.exists) {
      return res.status(200).json({ 
        success: true, 
        data: {
          date,
          foods: [],
          totalNutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 }
        }
      });
    }

    const diet = Diet.fromFirestore(dietDoc);
    
    // Get detailed food information for each food in the diet
    const foodsWithDetails = await Promise.all(
      diet.foods.map(async (dietFood) => {
        const foodDoc = await db.collection('foods').doc(dietFood.foodId).get();
        if (foodDoc.exists) {
          const food = Food.fromFirestore(foodDoc);
          return {
            ...food,
            addedAt: dietFood.addedAt
          };
        }
        return null;
      })
    );

    // Filter out null values (foods that don't exist anymore)
    const validFoods = foodsWithDetails.filter(food => food !== null);

    // Calculate total nutrition
    const totalNutrition = validFoods.reduce(
      (total, food) => ({
        cal: total.cal + food.nutrition.cal,
        protein: Math.round((total.protein + food.nutrition.protein) * 10) / 10,
        carbs: Math.round((total.carbs + food.nutrition.carbs) * 10) / 10,
        fat: Math.round((total.fat + food.nutrition.fat) * 10) / 10
      }),
      { cal: 0, protein: 0, carbs: 0, fat: 0 }
    );

    res.status(200).json({ 
      success: true, 
      data: {
        date,
        foods: validFoods,
        totalNutrition
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Add food to today's diet
// @route   POST /api/v1/diet
// @access  Private
exports.addFoodToDiet = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { foodId } = req.body;
    
    if (!foodId) {
      return res.status(400).json({ success: false, error: 'foodId is required' });
    }
    
    // Use timezone-safe date formatting instead of toISOString()
    const date = getLocalDateString();
    const now = new Date();

    console.log(`🍽️ [Backend] Adding food to diet for date: ${date} (local timezone)`);

    // Validate that the food exists and get its nutrition data
    const foodDoc = await db.collection('foods').doc(foodId).get();
    if (!foodDoc.exists) {
      return res.status(404).json({ success: false, error: 'Food not found' });
    }
    const food = foodDoc.data();

    const dietRef = db.collection('users').doc(uid).collection('diets').doc(date);
    const dietDoc = await dietRef.get();

    let updatedFoods = [];
    let currentTotalNutrition = { cal: 0, protein: 0, carbs: 0, fat: 0 };

    if (!dietDoc.exists) {
      // Create new diet document if it doesn't exist
      updatedFoods = [{ foodId, addedAt: now }];
      currentTotalNutrition = {
        cal: food.nutrition?.cal || 0,
        protein: food.nutrition?.protein || 0,
        carbs: food.nutrition?.carbs || 0,
        fat: food.nutrition?.fat || 0
      };

      const newDiet = {
        date,
        foods: updatedFoods,
        totalNutrition: currentTotalNutrition,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await dietRef.set(newDiet);
    } else {
      // Add food to existing diet and recalculate total nutrition
      const existingData = dietDoc.data();
      updatedFoods = [...(existingData.foods || []), { foodId, addedAt: now }];
      
      // Get current total nutrition or start from zero
      currentTotalNutrition = existingData.totalNutrition || { cal: 0, protein: 0, carbs: 0, fat: 0 };
      
      // Add new food's nutrition to the total
      currentTotalNutrition = {
        cal: currentTotalNutrition.cal + (food.nutrition?.cal || 0),
        protein: Math.round((currentTotalNutrition.protein + (food.nutrition?.protein || 0)) * 10) / 10,
        carbs: Math.round((currentTotalNutrition.carbs + (food.nutrition?.carbs || 0)) * 10) / 10,
        fat: Math.round((currentTotalNutrition.fat + (food.nutrition?.fat || 0)) * 10) / 10
      };

      await dietRef.update({
        foods: updatedFoods,
        totalNutrition: currentTotalNutrition,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`✅ Backend: Food ${foodId} added to diet for ${date}. New total nutrition:`, currentTotalNutrition);

    res.status(200).json({ success: true, message: 'Food added to diet successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Remove food from today's diet
// @route   DELETE /api/v1/diet/:foodId
// @access  Private
exports.removeFoodFromDiet = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { foodId } = req.params;
    const { addedAt } = req.body; // Optional timestamp to identify specific instance
    
    if (!foodId) {
      return res.status(400).json({ success: false, error: 'foodId is required' });
    }
    
    // Use timezone-safe date formatting instead of toISOString()
    const date = getLocalDateString();

    console.log(`🗑️ [Backend] Removing food from diet for date: ${date} (local timezone)${addedAt ? ` at ${addedAt}` : ' (first occurrence)'}`);

    const dietRef = db.collection('users').doc(uid).collection('diets').doc(date);
    const dietDoc = await dietRef.get();

    if (!dietDoc.exists) {
      return res.status(404).json({ success: false, error: 'No diet found for today' });
    }

    const diet = Diet.fromFirestore(dietDoc);

    // Check if the food exists in the diet
    const foodExists = diet.foods.some(food => food.foodId === foodId);
    if (!foodExists) {
      return res.status(404).json({ success: false, error: 'Food not found in today\'s diet' });
    }

    let newFoods;
    
    if (addedAt) {
      // Remove specific instance by timestamp
      const targetTimestamp = new Date(addedAt);
      let removed = false;
      
      newFoods = diet.foods.filter(food => {
        if (!removed && food.foodId === foodId) {
          const foodTimestamp = food.addedAt?.toDate ? food.addedAt.toDate() : new Date(food.addedAt);
          if (Math.abs(foodTimestamp.getTime() - targetTimestamp.getTime()) < 1000) { // 1 second tolerance
            removed = true;
            return false; // Remove this one
          }
        }
        return true; // Keep this one
      });
      
      if (!removed) {
        return res.status(404).json({ success: false, error: 'Specific food instance not found in today\'s diet' });
      }
    } else {
      // Remove first occurrence only (for backward compatibility)
      let removed = false;
      newFoods = diet.foods.filter(food => {
        if (!removed && food.foodId === foodId) {
          removed = true;
          return false; // Remove first occurrence
        }
        return true; // Keep all others
      });
    }

    await dietRef.update({ 
      foods: newFoods,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ success: true, message: 'Food removed from diet successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
const { db } = require('../config/firebase');
const User = require('../models/userModel');
const Diet = require('../models/dietModel');

// @desc    Get home screen data
// @route   GET /api/v1/home
// @access  Private
exports.getHomeData = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { date } = req.query;

    console.log(`🏠 Backend: Getting home data for user ${uid} on date ${date}`);

    // Get user data
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = User.fromFirestore(userDoc);
    console.log('👤 Backend: User data:', user);

    // Get diet data for date
    const dietDoc = await db.collection('users').doc(uid).collection('diets').doc(date).get();
    
    let diet = null;
    let diets = [];
    let totals = { cal: 0, protein: 0, carbs: 0, fat: 0 };

    if (dietDoc.exists) {
      const dietData = dietDoc.data();
      console.log('🍽️ Backend: Raw diet data:', dietData);

      // Populate food details for each food in the diet
      const populatedFoods = [];
      if (dietData.foods && Array.isArray(dietData.foods)) {
        for (const foodEntry of dietData.foods) {
          const foodDoc = await db.collection('foods').doc(foodEntry.foodId).get();
          if (foodDoc.exists) {
            const foodData = foodDoc.data();
            populatedFoods.push({
              id: foodDoc.id,
              name: foodData.name,
              description: foodData.description,
              nutrition: foodData.nutrition,
              imageUrl: foodData.imageUrl,
              addedAt: foodEntry.addedAt
            });
          }
        }
      }

      // Create diet object with populated foods
      diet = new Diet(dietDoc.id, dietData.totalNutrition, populatedFoods);
      diets = [diet];
      totals = dietData.totalNutrition || totals;
      
      console.log('🍽️ Backend: Diet with populated foods:', diet);
      console.log('🍽️ Backend: Total nutrition:', totals);
    } else {
      console.log('🍽️ Backend: No diet data found for date, returning empty data');
    }

    const responseData = {
      consumpedNutrition: totals, // Keep the original field name for frontend compatibility
      diets: diets,
      targetNutrition: user.targetNutrition || { cal: 2000, protein: 150, carbs: 250, fat: 67 }
    };

    console.log('📤 Backend: Sending response data:', responseData);

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Backend error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
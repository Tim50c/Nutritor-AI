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
      diet = Diet.fromFirestore(dietDoc);
      diets = [diet]; // Convert single diet to array
      totals = diet.totalNutrition || totals; // Use diet's total nutrition
      console.log('🍽️ Backend: Diet data found:', diet);
    } else {
      console.log('🍽️ Backend: No diet data found for date, returning empty data');
    }

    const responseData = {
      totals: totals,
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
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

    // Get user data
    const userDoc = await db.collection('users').doc(uid).get();
    const user = User.fromFirestore(userDoc);

    // Get diet data for date
    const dietDoc = await db.collection('users').doc(uid).collection('diets').doc(date).get();
    const diet = Diet.fromFirestore(dietDoc);

    res.status(200).json({
      success: true,
      data: {
        targetNutrition: user.targetNutrition,
        diet: diet
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
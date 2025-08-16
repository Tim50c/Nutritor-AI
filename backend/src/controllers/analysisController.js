const { db } = require('../config/firebase');
const WeightLog = require('../models/weightLogModel');
const User = require('../models/userModel');

// @desc    Get analysis data
// @route   GET /api/v1/analysis
// @access  Private
exports.getAnalysis = async (req, res, next) => {
  try {
    const { uid } = res.locals;

    // Get user data
    const userDoc = await db.collection('users').doc(uid).get();
    const user = User.fromFirestore(userDoc);

    // Calculate BMI
    const heightInMeters = user.height / 100;
    const bmi = user.weightCurrent / (heightInMeters * heightInMeters);

    // Get all diet data
    const dietsSnapshot = await db.collection('users').doc(uid).collection('diets').get();
    const diets = dietsSnapshot.docs.map(doc => doc.data());

    // Calculate total nutrition consumed
    const totalNutrition = diets.reduce((acc, diet) => {
      acc.cal += diet.totalNutrition.cal;
      acc.protein += diet.totalNutrition.protein;
      acc.carbs += diet.totalNutrition.carbs;
      acc.fat += diet.totalNutrition.fat;
      return acc;
    }, { cal: 0, protein: 0, carbs: 0, fat: 0 });

    // Get all weight data
    const weightsSnapshot = await db.collection('users').doc(uid).collection('weights').orderBy('date', 'desc').get();
    const weights = weightsSnapshot.docs.map(doc => WeightLog.fromFirestore(doc));

    // Calculate stats
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const dailyStats = weights.filter(w => w.date >= oneWeekAgo);
    const weeklyStats = weights.filter(w => w.date >= oneMonthAgo);
    const monthlyStats = weights.filter(w => w.date >= oneYearAgo);

    res.status(200).json({
      success: true,
      data: {
        weightGoal: user.weightGoal,
        currentWeight: user.weightCurrent,
        totalNutrition,
        bmi,
        dailyStats,
        weeklyStats,
        monthlyStats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update weight
// @route   PATCH /api/v1/analysis/weight
// @access  Private
exports.updateWeight = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { goalWeight, currentWeight } = req.body;

    await db.collection('users').doc(uid).update({ goalWeight, currentWeight });

    const newWeightLog = new WeightLog(null, new Date(), currentWeight);

    await db.collection('users').doc(uid).collection('weights').add(newWeightLog.toFirestore());

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
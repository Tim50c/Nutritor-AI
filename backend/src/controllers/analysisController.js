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
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = User.fromFirestore(userDoc);
    
    console.log('User data for BMI calculation:', {
      uid,
      height: user.height,
      weightCurrent: user.weightCurrent,
      weightGoal: user.weightGoal
    });

    // Calculate BMI with validation
    let bmi = 0;
    if (user.height && user.weightCurrent && user.height > 0 && user.weightCurrent > 0) {
      const heightInMeters = user.height / 100;
      bmi = user.weightCurrent / (heightInMeters * heightInMeters);
      // Round to 2 decimal places
      bmi = Math.round(bmi * 100) / 100;
    }

    console.log('BMI Calculation:', {
      height: user.height,
      weightCurrent: user.weightCurrent,
      heightInMeters: user.height / 100,
      calculatedBmi: bmi
    });

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

    // Update user document with correct field names
    const updateData = {};
    if (goalWeight !== undefined) updateData.weightGoal = goalWeight;
    if (currentWeight !== undefined) updateData.weightCurrent = currentWeight;

    await db.collection('users').doc(uid).update(updateData);

    // Create weight log entry if currentWeight is provided
    if (currentWeight !== undefined) {
      const newWeightLog = new WeightLog(null, new Date(), currentWeight);
      await db.collection('users').doc(uid).collection('weights').add(newWeightLog.toFirestore());
    }

    console.log('Weight updated:', { uid, updateData });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error updating weight:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
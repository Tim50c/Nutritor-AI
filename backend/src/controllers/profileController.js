const { db } = require('../config/firebase');
const User = require('../models/userModel');

// @desc    Get user profile
// @route   GET /api/v1/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const { uid } = res.locals;

    const userDoc = await db.collection('users').doc(uid).get();
    const user = User.fromFirestore(userDoc);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create user profile
// @route   POST /api/v1/profile
// @access  Private
exports.createUserProfile = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { name, email, dob, gender, height, weightCurrent, weightGoal, targetNutrition, fcmToken, notificationPreferences } = req.body;

    const newUser = new User(uid, name, email, dob, gender, height, weightCurrent, weightGoal, targetNutrition, fcmToken, notificationPreferences);

    await db.collection('users').doc(uid).set(newUser.toFirestore());

    res.status(201).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PATCH /api/v1/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { name, email, dob, gender, height, weightCurrent, weightGoal, targetNutrition } = req.body;

    const user = new User(uid, name, email, dob, gender, height, weightCurrent, weightGoal, targetNutrition);

    await db.collection('users').doc(uid).update(user.toFirestore());

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
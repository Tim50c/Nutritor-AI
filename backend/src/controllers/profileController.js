const { db, admin } = require('../config/firebase');
const User = require('../models/userModel');

// @desc    Get user profile
// @route   GET /api/v1/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const { uid } = res.locals;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    // Your model usage here is good.
    const user = User.fromFirestore(userDoc);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get user target nutrition
// @route   GET /api/v1/profile/nutrition-target
// @access  Private
exports.getUserNutritionTarget = async (req, res, next) => {
  try {
    const { uid } = res.locals;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    const userData = userDoc.data();
    const targetNutrition = userData.targetNutrition || {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 70
    };

    res.status(200).json({ success: true, data: targetNutrition });
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
    const { firstname, lastname, dob, gender, height, weightCurrent, weightGoal, targetNutrition } = req.body;

    // Check if profile already exists
    const existingUserDoc = await db.collection('users').doc(uid).get();
    if (existingUserDoc.exists) {
      return res.status(409).json({ success: false, error: 'User profile already exists.' });
    }

    // Create new user profile
    const userData = {
      firstname: firstname || '',
      lastname: lastname || '',
      dob: dob ? admin.firestore.Timestamp.fromDate(new Date(dob)) : null,
      gender: gender || '',
      height: height || 0,
      weightCurrent: weightCurrent || 0,
      weightGoal: weightGoal || 0,
      targetNutrition: targetNutrition || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(uid).set(userData);

    res.status(201).json({ success: true, message: 'Profile created successfully.', data: userData });
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
    const body = req.body;

    // --- CRITICAL FIX: Build a dynamic update object ---
    const updateData = {};

    // Only add fields to the update object if they exist in the request body
    if (body.firstname) updateData.firstname = body.firstname;
    if (body.lastname) updateData.lastname = body.lastname;
    if (body.dob) updateData.dob = admin.firestore.Timestamp.fromDate(new Date(body.dob));
    if (body.gender) updateData.gender = body.gender;
    if (body.height) updateData.height = body.height;
    if (body.weightCurrent) updateData.weightCurrent = body.weightCurrent;
    if (body.weightGoal) updateData.weightGoal = body.weightGoal;
    if (body.targetNutrition) updateData.targetNutrition = body.targetNutrition;

    // If the update object is empty, nothing was sent to update.
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ success: false, error: 'No update data provided.' });
    }

    // Always update the 'updatedAt' timestamp on any change
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const userRef = db.collection('users').doc(uid);
    await userRef.update(updateData);

    res.status(200).json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
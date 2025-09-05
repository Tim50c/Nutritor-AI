const { db, admin } = require('../config/firebase');
const imagekit = require('../config/imagekit'); // <-- Import imagekit
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

    const user = User.fromFirestore(userDoc);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * NEW FUNCTION
 * @desc    Update user avatar
 * @route   PATCH /api/v1/profile/avatar
 * @access  Private
 */
exports.updateUserAvatar = async (req, res) => {
  console.log('\n--- /profile/avatar ENDPOINT HIT ---');
  try {
    const { uid } = res.locals;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided. Please send the image as FormData with key "avatar".' 
      });
    }

    console.log(`[LOG] Received avatar for user ${uid}: ${imageFile.originalname}`);

    // Upload image to ImageKit
    const fileName = `avatar_${uid}_${Date.now()}`;
    const uploadResult = await imagekit.upload({
        file: imageFile.buffer,
        fileName: fileName,
        folder: "/avatars", // A dedicated folder for avatars
        useUniqueFileName: true,
    });

    const imageUrl = uploadResult.url;
    console.log(`[LOG] Avatar for user ${uid} uploaded to ${imageUrl}`);

    // Update user document in Firestore
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      avatar: imageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ 
      success: true, 
      message: 'Avatar updated successfully.',
      data: { avatarUrl: imageUrl }
    });

  } catch (error) {
    console.error('!!! ERROR IN /profile/avatar ENDPOINT !!!', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating avatar.',
    });
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
    const targetNutrition = userData.targetNutrition || { cal: 2000, protein: 150, carbs: 250, fat: 70 };
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

    const existingUserDoc = await db.collection('users').doc(uid).get();
    if (existingUserDoc.exists) {
      return res.status(409).json({ success: false, error: 'User profile already exists.' });
    }

    const userData = {
      firstname: firstname || '',
      lastname: lastname || '',
      dob: dob ? admin.firestore.Timestamp.fromDate(new Date(dob)) : null,
      gender: gender || '',
      height: height || 0,
      weightCurrent: weightCurrent || 0,
      weightGoal: weightGoal || 0,
      targetNutrition: targetNutrition || {},
      avatar: null, // Initialize avatar
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

    const updateData = {};

    if (body.firstname) updateData.firstname = body.firstname;
    if (body.lastname) updateData.lastname = body.lastname;
    if (body.dob) updateData.dob = admin.firestore.Timestamp.fromDate(new Date(body.dob));
    if (body.gender) updateData.gender = body.gender;
    
    // The controller expects height in cm and weight in kg, as converted by the frontend
    if (body.height) updateData.height = body.height;
    if (body.weightCurrent) updateData.weightCurrent = body.weightCurrent;
    if (body.weightGoal) updateData.weightGoal = body.weightGoal;
    
    if (body.targetNutrition) updateData.targetNutrition = body.targetNutrition;
    if (body.onboardingComplete !== undefined) updateData.onboardingComplete = body.onboardingComplete;
    
    // Add unitPreferences to the update object if it exists in the body
    if (body.unitPreferences) updateData.unitPreferences = body.unitPreferences;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ success: false, error: 'No update data provided.' });
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const userRef = db.collection('users').doc(uid);
    await userRef.update(updateData);

    res.status(200).json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
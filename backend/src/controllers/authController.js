const { db, admin } = require('../config/firebase');

/**
 * @desc    Register a new user's profile in Firestore after Firebase Auth creation
 * @route   POST /api/v1/auth/register
 * @access  Private (Requires valid Firebase ID Token)
 */
exports.registerUserProfile = async (req, res) => {
  try {
    const { uid } = res.locals; // UID comes from your authMiddleware
    const { email, firstname, lastname, dob } = req.body;

    // Basic validation
    if (!email || !firstname || !lastname || !dob) {
      return res.status(400).json({ success: false, error: 'Missing required profile information.' });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        return res.status(409).json({ success: false, error: 'User profile already exists.' });
    }

    const newUserProfile = {
      id: uid,
      firstname,
      lastname,
      email,
      dob: admin.firestore.Timestamp.fromDate(new Date(dob)),
      gender: req.body.gender || null,
      height: req.body.height || null,
      weightCurrent: req.body.weightCurrent || null,
      weightGoal: req.body.weightGoal || null,
      targetNutrition: req.body.targetNutrition || { cal: 2000, protein: 150, carbs: 200, fat: 60 },
      fcmToken: req.body.fcmToken || null,
      notificationPreferences: req.body.notificationPreferences || { mealReminders: true, goalMilestoneNotification: true, newPlanRecommendations: true },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      onboardingComplete: true,
    };

    await db.collection('users').doc(uid).set(newUserProfile);

    res.status(201).json({ success: true, data: newUserProfile });
  } catch (error) {
    console.error('Error creating user profile in Firestore:', error);
    res.status(500).json({ success: false, error: 'Server error during profile creation.' });
  }
};
const { admin } = require('../config/firebase');

// @desc    Change password
// @route   PATCH /api/v1/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { newPassword } = req.body;

    // --- IMPROVEMENT 1: Input Validation ---
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long.' 
      });
    }

    // Check password strength: at least one letter, one number, one special character
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one letter, one number, and one special character.'
      });
    }

    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error(error);
    
    // --- IMPROVEMENT 2: Specific Error Handling ---
    if (error.code === 'auth/weak-password') {
        return res.status(400).json({ success: false, error: 'The new password is too weak.' });
    }

    res.status(500).json({ success: false, error: 'Server error while changing password.' });
  }
};
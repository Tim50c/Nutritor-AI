const { admin } = require('../config/firebase');

// @desc    Change password
// @route   PATCH /api/v1/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { newPassword } = req.body;

    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
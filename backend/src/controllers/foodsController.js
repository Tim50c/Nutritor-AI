const { db } = require('../config/firebase');
const Food = require('../models/foodModel');

// @desc    Get food details
// @route   GET /api/v1/foods/:foodId
// @access  Private
exports.getFoodDetails = async (req, res, next) => {
  try {
    const { foodId } = req.params;

    const foodDoc = await db.collection('foods').doc(foodId).get();
    const food = Food.fromFirestore(foodDoc);

    res.status(200).json({ success: true, data: food });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
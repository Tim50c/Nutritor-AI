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

// @desc    Update food image URL
// @route   PUT /api/v1/foods/:foodId/image
// @access  Private
exports.updateFoodImage = async (req, res, next) => {
  try {
    const { foodId } = req.params;
    const { imageUrl } = req.body;

    // Validate input
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image URL is required' 
      });
    }

    // Check if food exists
    const foodDoc = await db.collection('foods').doc(foodId).get();
    if (!foodDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Food not found' 
      });
    }

    // Update the food image URL
    await db.collection('foods').doc(foodId).update({
      imageUrl: imageUrl,
      updatedAt: new Date()
    });

    // Get updated food data
    const updatedFoodDoc = await db.collection('foods').doc(foodId).get();
    const updatedFood = Food.fromFirestore(updatedFoodDoc);

    res.status(200).json({ 
      success: true, 
      message: 'Food image updated successfully',
      data: updatedFood 
    });
  } catch (error) {
    console.error('Error updating food image:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while updating food image' 
    });
  }
};
const { db } = require('../config/firebase');
const Food = require('../models/foodModel');

// @desc    Search foods
// @route   GET /api/v1/search
// @access  Private
exports.searchFoods = async (req, res, next) => {
  try {
    const { query, cal, protein, carb, fat } = req.query;

    let queryRef = db.collection('foods');

    if (query) {
      queryRef = queryRef.where('name', '>=', query).where('name', '<=', query + '\uf8ff');
    }

    if (cal) {
      queryRef = queryRef.where('nutrition.cal', '<=', parseInt(cal));
    }

    if (protein) {
      queryRef = queryRef.where('nutrition.protein', '>=', parseInt(protein));
    }

    if (carb) {
      queryRef = queryRef.where('nutrition.carbs', '<=', parseInt(carb));
    }

    if (fat) {
      queryRef = queryRef.where('nutrition.fat', '<=', parseInt(fat));
    }

    const foodsSnapshot = await queryRef.get();
    const foods = foodsSnapshot.docs.map(doc => Food.fromFirestore(doc));

    res.status(200).json({ success: true, data: foods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
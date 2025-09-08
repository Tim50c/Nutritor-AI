const { db } = require('../config/firebase');
const Food = require('../models/foodModel');

// @desc    Search foods
// @route   GET /api/v1/search
// @access  Private
exports.searchFoods = async (req, res, next) => {
  try {
    const { query, calo, protein, carb, fat } = req.query;

    let queryRef = db.collection('foods');
    let foodsSnapshot;

    if (query) {
      // For substring search, we need to get all foods and filter on the server
      // Since Firestore doesn't support case-insensitive substring search well
      foodsSnapshot = await queryRef.get();
      
      // Filter foods by substring search (case-insensitive)
      let foods = foodsSnapshot.docs
        .map(doc => Food.fromFirestore(doc))
        .filter(food => 
          food.name.toLowerCase().includes(query.toLowerCase())
        );

      // Apply nutrition filters if provided
      if (calo) {
        foods = foods.filter(food => food.nutrition.cal <= parseInt(calo));
      }

      if (protein) {
        foods = foods.filter(food => food.nutrition.protein <= parseInt(protein));
      }

      if (carb) {
        foods = foods.filter(food => food.nutrition.carbs <= parseInt(carb));
      }

      if (fat) {
        foods = foods.filter(food => food.nutrition.fat <= parseInt(fat));
      }

      res.status(200).json({ success: true, data: foods });
    } else {
      // If no query, get all foods and filter in memory to avoid Firestore query limitations
      foodsSnapshot = await queryRef.get();
      let foods = foodsSnapshot.docs.map(doc => Food.fromFirestore(doc));

      // Apply nutrition filters in memory
      if (calo) {
        foods = foods.filter(food => food.nutrition.cal <= parseInt(calo));
      }

      if (protein) {
        foods = foods.filter(food => food.nutrition.protein <= parseInt(protein));
      }

      if (carb) {
        foods = foods.filter(food => food.nutrition.carbs <= parseInt(carb));
      }

      if (fat) {
        foods = foods.filter(food => food.nutrition.fat <= parseInt(fat));
      }

      res.status(200).json({ success: true, data: foods });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
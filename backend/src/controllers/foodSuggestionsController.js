const { db } = require('../config/firebase');
const Food = require('../models/foodModel');

// @desc    Get food suggestions based on nutritional gaps
// @route   POST /api/v1/foods/suggestions
// @access  Private
exports.getFoodSuggestions = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { targetNutrition, consumedNutrition } = req.body;

    // Calculate nutritional gaps
    const nutritionalGaps = {
      calories: Math.max(0, targetNutrition.calories - consumedNutrition.calories),
      protein: Math.max(0, targetNutrition.protein - consumedNutrition.protein),
      carbs: Math.max(0, targetNutrition.carbs - consumedNutrition.carbs),
      fat: Math.max(0, targetNutrition.fat - consumedNutrition.fat)
    };

    // Get user preferences or dietary restrictions if any
    const userDoc = await db.collection('users').doc(uid).get();
    const userPreferences = userDoc.exists ? userDoc.data().dietaryPreferences || {} : {};

    let queryRef = db.collection('foods');

    // Filter foods based on nutritional gaps
    // Prioritize foods that help fill the largest gaps
    const suggestions = [];
    
    // Query for protein-rich foods if protein gap is significant
    if (nutritionalGaps.protein > 0) {
      const proteinFoodsSnapshot = await queryRef
        .where('nutrition.protein', '>=', Math.min(nutritionalGaps.protein * 0.3, 20))
        .limit(5)
        .get();
      
      proteinFoodsSnapshot.docs.forEach(doc => {
        const food = Food.fromFirestore(doc);
        food.suggestionReason = 'High in protein';
        suggestions.push(food);
      });
    }

    // Query for carb-rich foods if carb gap is significant
    if (nutritionalGaps.carbs > 0) {
      const carbFoodsSnapshot = await queryRef
        .where('nutrition.carbs', '>=', Math.min(nutritionalGaps.carbs * 0.3, 30))
        .limit(5)
        .get();
      
      carbFoodsSnapshot.docs.forEach(doc => {
        const food = Food.fromFirestore(doc);
        food.suggestionReason = 'Good source of carbs';
        if (!suggestions.find(s => s.id === food.id)) {
          suggestions.push(food);
        }
      });
    }

    // Query for low-calorie foods if over calorie target
    if (nutritionalGaps.calories <= 200) {
      const lowCalFoodsSnapshot = await queryRef
        .where('nutrition.cal', '<=', 200)
        .limit(5)
        .get();
      
      lowCalFoodsSnapshot.docs.forEach(doc => {
        const food = Food.fromFirestore(doc);
        food.suggestionReason = 'Low calorie option';
        if (!suggestions.find(s => s.id === food.id)) {
          suggestions.push(food);
        }
      });
    }

    // If no specific gaps, get balanced foods
    if (suggestions.length === 0) {
      const balancedFoodsSnapshot = await queryRef
        .where('nutrition.cal', '>=', 100)
        .where('nutrition.cal', '<=', 400)
        .limit(10)
        .get();
      
      balancedFoodsSnapshot.docs.forEach(doc => {
        const food = Food.fromFirestore(doc);
        food.suggestionReason = 'Balanced nutrition';
        suggestions.push(food);
      });
    }

    // Sort suggestions by relevance and limit to 10
    const sortedSuggestions = suggestions
      .slice(0, 10)
      .map(food => ({
        ...food,
        nutritionalMatch: calculateNutritionalMatch(food, nutritionalGaps)
      }))
      .sort((a, b) => b.nutritionalMatch - a.nutritionalMatch);

    res.status(200).json({ 
      success: true, 
      data: {
        suggestions: sortedSuggestions,
        nutritionalGaps,
        targetNutrition,
        consumedNutrition
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Helper function to calculate how well a food matches nutritional gaps
function calculateNutritionalMatch(food, gaps) {
  let score = 0;
  
  // Higher score for foods that help fill gaps without exceeding too much
  if (gaps.protein > 0) {
    score += Math.min(food.nutrition.protein / gaps.protein, 1) * 0.3;
  }
  
  if (gaps.carbs > 0) {
    score += Math.min(food.nutrition.carbs / gaps.carbs, 1) * 0.3;
  }
  
  if (gaps.fat > 0) {
    score += Math.min(food.nutrition.fat / gaps.fat, 1) * 0.2;
  }
  
  if (gaps.calories > 0) {
    score += Math.min(food.nutrition.cal / gaps.calories, 1) * 0.2;
  }
  
  return score;
}

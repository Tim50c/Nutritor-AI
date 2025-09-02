const { db, admin } = require('../config/firebase');
const Diet = require('../models/dietModel');
const Food = require('../models/foodModel');

// @desc    Get consumed nutrition for a specific date
// @route   GET /api/v1/diet/nutrition?date=YYYY-MM-DD
// @access  Private
exports.getConsumedNutrition = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { date } = req.query;

    console.log("🍎 Backend: getConsumedNutrition called:", {
      uid,
      date,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    if (!date) {
      console.log("❌ Backend: Missing date parameter");
      return res.status(400).json({ 
        success: false, 
        error: 'Date parameter is required (format: YYYY-MM-DD)' 
      });
    }

    console.log("🔍 Backend: Fetching diet document for:", { uid, date });
    const dietDoc = await db.collection('users').doc(uid).collection('diets').doc(date).get();
    
    if (!dietDoc.exists) {
      console.log("📭 Backend: No diet found for date, returning zero nutrition");
      return res.status(200).json({ 
        success: true, 
        data: {
          date,
          consumedNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          totalFoods: 0
        }
      });
    }

    const diet = Diet.fromFirestore(dietDoc);
    console.log("🍽️ Backend: Diet found:", {
      date,
      foodCount: diet.foods?.length || 0,
      foods: diet.foods
    });
    
    // Get detailed food information for each food in the diet
    const foodsWithDetails = await Promise.all(
      diet.foods.map(async (dietFood) => {
        console.log("🔍 Backend: Fetching food details for:", dietFood.foodId);
        const foodDoc = await db.collection('foods').doc(dietFood.foodId).get();
        if (foodDoc.exists) {
          const food = Food.fromFirestore(foodDoc);
          console.log("✅ Backend: Food found:", { id: food.id, name: food.name, nutrition: food.nutrition });
          return food;
        } else {
          console.log("❌ Backend: Food not found:", dietFood.foodId);
        }
        return null;
      })
    );

    // Filter out null values (foods that don't exist anymore)
    const validFoods = foodsWithDetails.filter(food => food !== null);
    console.log("📊 Backend: Valid foods:", validFoods.length);

    // Calculate total consumed nutrition
    const consumedNutrition = validFoods.reduce(
      (total, food) => ({
        calories: total.calories + food.nutrition.cal,
        protein: Math.round((total.protein + food.nutrition.protein) * 10) / 10,
        carbs: Math.round((total.carbs + food.nutrition.carbs) * 10) / 10,
        fat: Math.round((total.fat + food.nutrition.fat) * 10) / 10
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const responseData = {
      date,
      consumedNutrition,
      totalFoods: validFoods.length,
      foodNames: validFoods.map(food => food.name) // Optional: list of consumed foods
    };

    console.log("📤 Backend: Sending consumed nutrition response:", responseData);

    res.status(200).json({ 
      success: true, 
      data: responseData
    });
  } catch (error) {
    console.error("❌ Backend: Error in getConsumedNutrition:", {
      message: error.message,
      stack: error.stack,
      uid: res.locals?.uid,
      date: req.query?.date
    });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get diet for a specific date with detailed food information
// @route   GET /api/v1/diet
// @access  Private
exports.getDiet = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { date } = req.query;

    const dietDoc = await db.collection('users').doc(uid).collection('diets').doc(date).get();
    
    if (!dietDoc.exists) {
      return res.status(200).json({ 
        success: true, 
        data: {
          date,
          foods: [],
          totalNutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 }
        }
      });
    }

    const diet = Diet.fromFirestore(dietDoc);
    
    // Get detailed food information for each food in the diet
    const foodsWithDetails = await Promise.all(
      diet.foods.map(async (dietFood) => {
        const foodDoc = await db.collection('foods').doc(dietFood.foodId).get();
        if (foodDoc.exists) {
          const food = Food.fromFirestore(foodDoc);
          return {
            ...food,
            addedAt: dietFood.addedAt
          };
        }
        return null;
      })
    );

    // Filter out null values (foods that don't exist anymore)
    const validFoods = foodsWithDetails.filter(food => food !== null);

    // Calculate total nutrition
    const totalNutrition = validFoods.reduce(
      (total, food) => ({
        cal: total.cal + food.nutrition.cal,
        protein: Math.round((total.protein + food.nutrition.protein) * 10) / 10,
        carbs: Math.round((total.carbs + food.nutrition.carbs) * 10) / 10,
        fat: Math.round((total.fat + food.nutrition.fat) * 10) / 10
      }),
      { cal: 0, protein: 0, carbs: 0, fat: 0 }
    );

    res.status(200).json({ 
      success: true, 
      data: {
        date,
        foods: validFoods,
        totalNutrition
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Add food to today's diet
// @route   POST /api/v1/diet
// @access  Private
exports.addFoodToDiet = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { foodId } = req.body;
    const date = new Date().toISOString().slice(0, 10);

    // Validate that the food exists
    const foodDoc = await db.collection('foods').doc(foodId).get();
    if (!foodDoc.exists) {
      return res.status(404).json({ success: false, error: 'Food not found' });
    }

    const dietRef = db.collection('users').doc(uid).collection('diets').doc(date);
    const dietDoc = await dietRef.get();

    if (!dietDoc.exists) {
      // Create new diet document if it doesn't exist
      const newDiet = {
        date,
        foods: [{ foodId, addedAt: admin.firestore.FieldValue.serverTimestamp() }],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await dietRef.set(newDiet);
    } else {
      // Add food to existing diet
      await dietRef.update({
        foods: admin.firestore.FieldValue.arrayUnion({ 
          foodId, 
          addedAt: admin.firestore.FieldValue.serverTimestamp() 
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.status(200).json({ success: true, message: 'Food added to diet successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Remove food from today's diet
// @route   DELETE /api/v1/diet/:foodId
// @access  Private
exports.removeFoodFromDiet = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { foodId } = req.params;
    const date = new Date().toISOString().slice(0, 10);

    const dietRef = db.collection('users').doc(uid).collection('diets').doc(date);

    const dietDoc = await dietRef.get();
    const diet = Diet.fromFirestore(dietDoc);

    const newFoods = diet.foods.filter(food => food.foodId !== foodId);

    await dietRef.update({ foods: newFoods });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
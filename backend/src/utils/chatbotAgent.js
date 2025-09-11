const { db, admin } = require('../config/firebase');
const Food = require('../models/foodModel');
const Diet = require('../models/dietModel');

// Helper function for timezone-safe date formatting
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// In-memory cache for foods (similar to searchController)
let foodsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Function to load all foods into cache
const loadFoodsCache = async () => {
  try {
    console.log('[Agent] Loading foods cache...');
    const queryRef = db.collection('foods');
    const foodsSnapshot = await queryRef.get();
    
    foodsCache = foodsSnapshot.docs.map(doc => Food.fromFirestore(doc));
    cacheTimestamp = Date.now();
    
    console.log(`[Agent] Foods cache loaded: ${foodsCache.length} foods`);
    return foodsCache;
  } catch (error) {
    console.error('[Agent] Error loading foods cache:', error);
    throw error;
  }
};

// Function to get foods from cache
const getFoodsFromCache = async () => {
  if (!foodsCache || !cacheTimestamp || (Date.now() - cacheTimestamp > CACHE_DURATION)) {
    await loadFoodsCache();
  }
  return foodsCache;
};

// 1. Get all foods from database
async function getAllFoods() {
  try {
    const foods = await getFoodsFromCache();
    return foods.map(food => ({
      id: food.id,
      name: food.name,
      nutrition: food.nutrition,
      description: food.description
    }));
  } catch (error) {
    console.error('[Agent] Error getting all foods:', error);
    throw error;
  }
}

// 2. Search for food in database
async function searchFoodInDatabase(foodName) {
  try {
    const foods = await getFoodsFromCache();
    const searchTerm = foodName.toLowerCase().trim();
    
    const matchedFoods = foods.filter(food => 
      food.name.toLowerCase().includes(searchTerm)
    );
    
    return matchedFoods.map(food => ({
      id: food.id,
      name: food.name,
      nutrition: food.nutrition,
      description: food.description
    }));
  } catch (error) {
    console.error('[Agent] Error searching food in database:', error);
    throw error;
  }
}

// 3. Check if specific food exists in database and return nutrition
async function checkFoodInDatabase(foodName) {
  try {
    const foods = await searchFoodInDatabase(foodName);
    
    if (foods.length > 0) {
      const food = foods[0];
      return {
        found: true,
        food: {
          id: food.id,
          name: food.name,
          nutrition: {
            calories: food.nutrition.cal,
            protein: food.nutrition.protein,
            carbs: food.nutrition.carbs,
            fat: food.nutrition.fat
          },
          description: food.description
        }
      };
    }
    
    return { found: false };
  } catch (error) {
    console.error('[Agent] Error checking food in database:', error);
    throw error;
  }
}

// 4. Add food to user's diet
async function addFoodToUserDiet(uid, foodId) {
  try {
    console.log(`[Agent] Adding food ${foodId} to diet for user ${uid}`);
    
    const date = getLocalDateString();
    
    // Validate that the food exists
    const foodDoc = await db.collection('foods').doc(foodId).get();
    if (!foodDoc.exists) {
      throw new Error('Food not found');
    }
    const food = foodDoc.data();

    const dietRef = db.collection('users').doc(uid).collection('diets').doc(date);
    const dietDoc = await dietRef.get();
    const now = new Date();

    let updatedFoods = [];
    let currentTotalNutrition = { cal: 0, protein: 0, carbs: 0, fat: 0 };

    if (!dietDoc.exists) {
      // Create new diet document
      updatedFoods = [{ foodId, addedAt: now }];
      currentTotalNutrition = {
        cal: food.nutrition?.cal || 0,
        protein: food.nutrition?.protein || 0,
        carbs: food.nutrition?.carbs || 0,
        fat: food.nutrition?.fat || 0
      };

      const newDiet = {
        date,
        foods: updatedFoods,
        totalNutrition: currentTotalNutrition,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await dietRef.set(newDiet);
    } else {
      // Add food to existing diet
      const existingData = dietDoc.data();
      updatedFoods = [...(existingData.foods || []), { foodId, addedAt: now }];
      
      currentTotalNutrition = existingData.totalNutrition || { cal: 0, protein: 0, carbs: 0, fat: 0 };
      
      // Add new food's nutrition to the total
      currentTotalNutrition = {
        cal: currentTotalNutrition.cal + (food.nutrition?.cal || 0),
        protein: Math.round((currentTotalNutrition.protein + (food.nutrition?.protein || 0)) * 10) / 10,
        carbs: Math.round((currentTotalNutrition.carbs + (food.nutrition?.carbs || 0)) * 10) / 10,
        fat: Math.round((currentTotalNutrition.fat + (food.nutrition?.fat || 0)) * 10) / 10
      };

      await dietRef.update({
        foods: updatedFoods,
        totalNutrition: currentTotalNutrition,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`[Agent] Food ${foodId} added to diet successfully`);
    return {
      success: true,
      message: `${food.name} added to your diet for today`,
      totalNutrition: currentTotalNutrition
    };
  } catch (error) {
    console.error('[Agent] Error adding food to diet:', error);
    throw error;
  }
}

// 5. Get user's diet for a specific day
async function getUserDietForDay(uid, date) {
  try {
    console.log(`[Agent] Getting diet for user ${uid} on ${date}`);
    
    const dietDoc = await db.collection('users').doc(uid).collection('diets').doc(date).get();
    
    if (!dietDoc.exists) {
      return {
        date,
        foods: [],
        totalNutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 }
      };
    }
    
    const dietData = dietDoc.data();
    
    // Populate food details
    const populatedFoods = [];
    if (dietData.foods && Array.isArray(dietData.foods)) {
      for (const foodEntry of dietData.foods) {
        const foodDoc = await db.collection('foods').doc(foodEntry.foodId).get();
        if (foodDoc.exists) {
          const foodData = foodDoc.data();
          populatedFoods.push({
            id: foodDoc.id,
            name: foodData.name,
            nutrition: foodData.nutrition,
            description: foodData.description,
            addedAt: foodEntry.addedAt
          });
        }
      }
    }
    
    return {
      date,
      foods: populatedFoods,
      totalNutrition: dietData.totalNutrition || { cal: 0, protein: 0, carbs: 0, fat: 0 }
    };
  } catch (error) {
    console.error('[Agent] Error getting user diet:', error);
    throw error;
  }
}

// 6. Remove food from user's diet
async function removeFoodFromUserDiet(uid, foodId, date = null, index = null) {
  try {
    const targetDate = date || getLocalDateString();
    console.log(`[Agent] Removing food ${foodId} from diet for user ${uid} on ${targetDate}`);
    
    // Get the food data to subtract its nutrition
    const foodDoc = await db.collection('foods').doc(foodId).get();
    if (!foodDoc.exists) {
      throw new Error('Food not found');
    }
    const food = foodDoc.data();

    const dietRef = db.collection('users').doc(uid).collection('diets').doc(targetDate);
    const dietDoc = await dietRef.get();

    if (!dietDoc.exists) {
      throw new Error('No diet found for this date');
    }

    const existingData = dietDoc.data();
    let foodToRemoveIndex = -1;

    // Find food to remove (by index if provided, otherwise first occurrence)
    if (index !== null && !isNaN(parseInt(index))) {
      const targetIndex = parseInt(index);
      if (targetIndex >= 0 && targetIndex < existingData.foods.length && 
          existingData.foods[targetIndex].foodId === foodId) {
        foodToRemoveIndex = targetIndex;
      }
    } else {
      foodToRemoveIndex = existingData.foods.findIndex(food => food.foodId === foodId);
    }

    if (foodToRemoveIndex === -1) {
      throw new Error('Food not found in diet');
    }

    // Remove the food
    const newFoods = [...existingData.foods];
    newFoods.splice(foodToRemoveIndex, 1);

    // Recalculate total nutrition
    const currentTotal = existingData.totalNutrition || { cal: 0, protein: 0, carbs: 0, fat: 0 };
    const newTotalNutrition = {
      cal: Math.max(0, currentTotal.cal - (food.nutrition?.cal || 0)),
      protein: Math.max(0, Math.round((currentTotal.protein - (food.nutrition?.protein || 0)) * 10) / 10),
      carbs: Math.max(0, Math.round((currentTotal.carbs - (food.nutrition?.carbs || 0)) * 10) / 10),
      fat: Math.max(0, Math.round((currentTotal.fat - (food.nutrition?.fat || 0)) * 10) / 10)
    };

    await dietRef.update({ 
      foods: newFoods,
      totalNutrition: newTotalNutrition,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[Agent] Food removed from diet successfully`);
    return {
      success: true,
      message: `${food.name} removed from your diet`,
      totalNutrition: newTotalNutrition
    };
  } catch (error) {
    console.error('[Agent] Error removing food from diet:', error);
    throw error;
  }
}

// 7. Get current and goal weight
async function getCurrentAndGoalWeight(uid) {
  try {
    console.log(`[Agent] Getting weight data for user ${uid}`);
    
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    return {
      currentWeight: userData.weightCurrent || 0,
      goalWeight: userData.weightGoal || 0,
      unit: userData.unitPreferences?.weight || 'kg'
    };
  } catch (error) {
    console.error('[Agent] Error getting weight data:', error);
    throw error;
  }
}

// 8. Update current weight
async function updateCurrentWeight(uid, newWeight) {
  try {
    console.log(`[Agent] Updating weight for user ${uid} to ${newWeight}`);
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const goalWeight = userData.weightGoal;
    
    // Update weight in user profile
    await userRef.update({
      weightCurrent: newWeight,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create weight log entry
    await db.collection('users').doc(uid).collection('weights')
      .add({ 
        date: new Date(), 
        weight: newWeight 
      });
    
    // Check goal achievement
    const goalAchieved = goalWeight > 0 && Math.abs(newWeight - goalWeight) <= 0.1;
    
    console.log(`[Agent] Weight updated successfully. Goal achieved: ${goalAchieved}`);
    
    return {
      success: true,
      goalAchieved,
      currentWeight: newWeight,
      goalWeight,
      message: goalAchieved 
        ? `🎉 Congratulations! You've reached your weight goal of ${goalWeight}kg!` 
        : `Weight updated to ${newWeight}kg`
    };
  } catch (error) {
    console.error('[Agent] Error updating weight:', error);
    throw error;
  }
}

// 9. Enhanced image analysis with database matching
async function analyzeImageAndMatchFood(model, imageData) {
  try {
    console.log('[Agent] Analyzing image and matching with database...');
    
    // Step 1: Use Gemini vision to identify food
    const foodNameResult = await model.generateContent([
      "Identify the food in this image and return only the food name (no extra text):",
      { 
        inlineData: { 
          mimeType: "image/jpeg", 
          data: imageData 
        } 
      }
    ]);
    
    const identifiedFood = foodNameResult.response.text().trim();
    console.log(`[Agent] Identified food from image: ${identifiedFood}`);
    
    // Step 2: Search in database first
    const matchedFoods = await searchFoodInDatabase(identifiedFood);
    
    if (matchedFoods.length > 0) {
      const bestMatch = matchedFoods[0];
      return {
        found: true,
        food: bestMatch,
        source: "database",
        confidence: "high",
        message: `Found "${bestMatch.name}" in our database!`
      };
    }
    
    // Step 3: If not found, return AI guess
    return {
      found: false,
      guess: identifiedFood,
      source: "ai_guess",
      confidence: "medium",
      message: `I can see "${identifiedFood}" in the image, but it's not in our database yet.`
    };
  } catch (error) {
    console.error('[Agent] Error analyzing image:', error);
    throw error;
  }
}

module.exports = {
  getAllFoods,
  searchFoodInDatabase,
  checkFoodInDatabase,
  addFoodToUserDiet,
  getUserDietForDay,
  removeFoodFromUserDiet,
  getCurrentAndGoalWeight,
  updateCurrentWeight,
  analyzeImageAndMatchFood,
  getLocalDateString
};

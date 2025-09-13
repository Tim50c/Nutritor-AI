const { db, admin } = require('../config/firebase');
const Food = require('../models/foodModel');
const Diet = require('../models/dietModel');
const User = require('../models/userModel');

// Helper function for timezone-safe date formatting (UTC+7)
const getLocalDateString = (date = new Date()) => {
  // Convert to UTC+7 (Asia/Bangkok timezone)
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const utcPlus7Time = new Date(utcTime + (7 * 3600000));
  
  const year = utcPlus7Time.getFullYear();
  const month = String(utcPlus7Time.getMonth() + 1).padStart(2, '0');
  const day = String(utcPlus7Time.getDate()).padStart(2, '0');
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
    const weightUnit = userData.unitPreferences?.weight || 'kg';
    
    // Weight conversion logic
    const KG_TO_LBS = 2.20462;
    const kgToLbs = (kg) => Math.round(kg * KG_TO_LBS * 10) / 10;
    
    let currentWeight = userData.weightCurrent || 0;
    let goalWeight = userData.weightGoal || 0;
    
    // Convert to lbs if user preference is lbs
    if (weightUnit === 'lbs') {
      currentWeight = currentWeight ? kgToLbs(currentWeight) : 0;
      goalWeight = goalWeight ? kgToLbs(goalWeight) : 0;
    } else {
      // Round kg values to 1 decimal place
      currentWeight = Math.round(currentWeight * 10) / 10;
      goalWeight = Math.round(goalWeight * 10) / 10;
    }
    
    return {
      currentWeight,
      goalWeight,
      unit: weightUnit
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
    const weightUnit = userData.unitPreferences?.weight || 'kg';
    const goalWeight = userData.weightGoal;
    
    // Weight conversion logic
    const KG_TO_LBS = 2.20462;
    const kgToLbs = (kg) => Math.round(kg * KG_TO_LBS * 10) / 10;
    const lbsToKg = (lbs) => lbs / KG_TO_LBS;
    
    // Convert input weight to kg for storage if user entered in lbs
    let weightInKgForStorage = newWeight;
    if (weightUnit === 'lbs') {
      weightInKgForStorage = lbsToKg(newWeight);
    }
    
    // Update weight in user profile (always store in kg)
    await userRef.update({
      weightCurrent: weightInKgForStorage,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create weight log entry (always store in kg)
    await db.collection('users').doc(uid).collection('weights')
      .add({ 
        date: new Date(), 
        weight: weightInKgForStorage 
      });
    
    // Check goal achievement (always compare in kg)
    const goalAchieved = goalWeight > 0 && Math.abs(weightInKgForStorage - goalWeight) <= 0.1;
    
    // Prepare display values in user's preferred unit
    let displayCurrentWeight = weightInKgForStorage;
    let displayGoalWeight = goalWeight;
    
    if (weightUnit === 'lbs') {
      displayCurrentWeight = kgToLbs(weightInKgForStorage);
      displayGoalWeight = goalWeight ? kgToLbs(goalWeight) : 0;
    } else {
      // Round kg values to 1 decimal place
      displayCurrentWeight = Math.round(weightInKgForStorage * 10) / 10;
      displayGoalWeight = Math.round(goalWeight * 10) / 10;
    }
    
    console.log(`[Agent] Weight updated successfully. Goal achieved: ${goalAchieved}`);
    
    return {
      success: true,
      goalAchieved,
      currentWeight: displayCurrentWeight,
      goalWeight: displayGoalWeight,
      unit: weightUnit,
      message: goalAchieved 
        ? `🎉 Congratulations! You've reached your weight goal of ${displayGoalWeight}${weightUnit}!` 
        : `Weight updated to ${displayCurrentWeight}${weightUnit}`
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

// 10. Get user profile information
async function getUserProfile(uid) {
  try {
    console.log(`[Agent] Getting profile for user ${uid}`);
    
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return {
        success: false,
        error: 'User profile not found'
      };
    }
    
    const user = User.fromFirestore(userDoc);
    
    // Format date of birth for better readability
    let formattedDob = null;
    if (user.dob) {
      const dobDate = user.dob.toDate ? user.dob.toDate() : new Date(user.dob);
      formattedDob = dobDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Calculate age from date of birth
    let age = null;
    if (user.dob) {
      const dobDate = user.dob.toDate ? user.dob.toDate() : new Date(user.dob);
      const today = new Date();
      age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
    }
    
    // Format weight and height based on user preferences
    const weightUnit = user.unitPreferences?.weight || 'kg';
    const heightUnit = user.unitPreferences?.height || 'cm';
    
    let formattedCurrentWeight = user.weightCurrent;
    let formattedGoalWeight = user.weightGoal;
    let formattedHeight = user.height;
    
    if (weightUnit === 'lbs' && user.weightCurrent) {
      formattedCurrentWeight = Math.round(user.weightCurrent * 2.20462 * 10) / 10;
    }
    if (weightUnit === 'lbs' && user.weightGoal) {
      formattedGoalWeight = Math.round(user.weightGoal * 2.20462 * 10) / 10;
    }
    if (heightUnit === 'ft' && user.height) {
      const feet = Math.floor(user.height / 30.48);
      const inches = Math.round((user.height % 30.48) / 2.54);
      formattedHeight = `${feet}'${inches}"`;
    }
    
    return {
      success: true,
      profile: {
        personal: {
          firstName: user.firstname || 'Not set',
          lastName: user.lastname || 'Not set',
          fullName: `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Not set',
          dateOfBirth: formattedDob || 'Not set',
          age: age || 'Not set',
          gender: user.gender || 'Not set',
          email: user.email || 'Not available'
        },
        physical: {
          height: formattedHeight || 'Not set',
          heightUnit: heightUnit,
          currentWeight: formattedCurrentWeight || 'Not set',
          goalWeight: formattedGoalWeight || 'Not set',
          weightUnit: weightUnit
        },
        nutrition: {
          targetCalories: user.targetNutrition?.cal || 'Not set',
          targetProtein: user.targetNutrition?.protein || 'Not set',
          targetCarbs: user.targetNutrition?.carbs || 'Not set',
          targetFat: user.targetNutrition?.fat || 'Not set'
        },
        preferences: {
          weightUnit: user.unitPreferences?.weight || 'kg',
          heightUnit: user.unitPreferences?.height || 'cm'
        },
        status: {
          onboardingComplete: user.onboardingComplete || false,
          hasAvatar: !!user.avatar
        }
      }
    };
  } catch (error) {
    console.error('[Agent] Error getting user profile:', error);
    throw error;
  }
}

// 11. Update user profile information
async function updateUserProfile(uid, updateData) {
  try {
    console.log(`[Agent] Updating profile for user ${uid}`, updateData);
    
    // Validate that user exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return {
        success: false,
        error: 'User profile not found'
      };
    }
    
    const currentUserData = userDoc.data();
    const userRef = db.collection('users').doc(uid);
    const firebaseUpdateData = {};
    
    // Handle personal information updates
    if (updateData.firstName !== undefined) {
      firebaseUpdateData.firstname = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      firebaseUpdateData.lastname = updateData.lastName;
    }
    if (updateData.gender !== undefined) {
      firebaseUpdateData.gender = updateData.gender;
    }
    if (updateData.dateOfBirth !== undefined) {
      try {
        firebaseUpdateData.dob = admin.firestore.Timestamp.fromDate(new Date(updateData.dateOfBirth));
      } catch (error) {
        return {
          success: false,
          error: 'Invalid date format for date of birth'
        };
      }
    }
    
    // Handle physical measurements (convert to metric for storage)
    const currentWeightUnit = currentUserData.unitPreferences?.weight || 'kg';
    const currentHeightUnit = currentUserData.unitPreferences?.height || 'cm';
    
    if (updateData.height !== undefined) {
      let heightInCm = updateData.height;
      if (updateData.heightUnit === 'ft' || currentHeightUnit === 'ft') {
        // Assume height is in format like "5.8" representing 5'8"
        const feet = Math.floor(heightInCm);
        const inches = (heightInCm - feet) * 12;
        heightInCm = (feet * 12 + inches) * 2.54;
      }
      firebaseUpdateData.height = Math.round(heightInCm * 10) / 10;
    }
    
    if (updateData.currentWeight !== undefined) {
      let weightInKg = updateData.currentWeight;
      if (updateData.weightUnit === 'lbs' || currentWeightUnit === 'lbs') {
        weightInKg = weightInKg / 2.20462;
      }
      firebaseUpdateData.weightCurrent = Math.round(weightInKg * 10) / 10;
    }
    
    if (updateData.goalWeight !== undefined) {
      let weightInKg = updateData.goalWeight;
      if (updateData.weightUnit === 'lbs' || currentWeightUnit === 'lbs') {
        weightInKg = weightInKg / 2.20462;
      }
      firebaseUpdateData.weightGoal = Math.round(weightInKg * 10) / 10;
    }
    
    // Handle nutrition targets
    if (updateData.targetNutrition !== undefined) {
      firebaseUpdateData.targetNutrition = {
        cal: updateData.targetNutrition.calories || updateData.targetNutrition.cal,
        protein: updateData.targetNutrition.protein,
        carbs: updateData.targetNutrition.carbs,
        fat: updateData.targetNutrition.fat
      };
    }
    
    // Handle unit preferences
    if (updateData.weightUnit !== undefined || updateData.heightUnit !== undefined) {
      firebaseUpdateData.unitPreferences = {
        weight: updateData.weightUnit || currentUserData.unitPreferences?.weight || 'kg',
        height: updateData.heightUnit || currentUserData.unitPreferences?.height || 'cm'
      };
    }
    
    // Add timestamp
    firebaseUpdateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    if (Object.keys(firebaseUpdateData).length === 1) { // Only timestamp
      return {
        success: false,
        error: 'No valid update data provided'
      };
    }
    
    await userRef.update(firebaseUpdateData);
    
    // Build a descriptive message about what was updated
    const updatedFields = [];
    if (updateData.firstName !== undefined) updatedFields.push('first name');
    if (updateData.lastName !== undefined) updatedFields.push('last name');
    if (updateData.gender !== undefined) updatedFields.push('gender');
    if (updateData.dateOfBirth !== undefined) updatedFields.push('date of birth');
    if (updateData.height !== undefined) updatedFields.push('height');
    if (updateData.currentWeight !== undefined) updatedFields.push('current weight');
    if (updateData.goalWeight !== undefined) updatedFields.push('goal weight');
    if (updateData.weightUnit !== undefined || updateData.heightUnit !== undefined) updatedFields.push('unit preferences');
    if (updateData.targetNutrition !== undefined) updatedFields.push('nutrition targets');
    
    const updateMessage = updatedFields.length > 0 
      ? `Successfully updated your ${updatedFields.join(', ')}.`
      : 'Profile updated successfully.';
    
    // Get updated profile for response
    const updatedProfile = await getUserProfile(uid);
    
    return {
      success: true,
      message: updateMessage,
      updatedProfile: updatedProfile.profile
    };
  } catch (error) {
    console.error('[Agent] Error updating user profile:', error);
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
  getUserProfile,
  updateUserProfile,
  getLocalDateString
};

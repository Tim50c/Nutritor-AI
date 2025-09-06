// Helper: fetch user's diet document by date
async function fetchDietByDate(uid, date) {
  const dietDoc = await db.collection('users').doc(uid).collection('diets').doc(date).get();
  if (!dietDoc.exists) return null;
  return Diet.fromFirestore(dietDoc);
}

// Helper: calculate total nutrition for a diet
async function calculateTotalNutrition(diet) {
  if (!diet || !diet.foods) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  const foodsWithDetails = await Promise.all(
    diet.foods.map(async (dietFood) => {
      const foodDoc = await db.collection('foods').doc(dietFood.foodId).get();
      if (!foodDoc.exists) return null;
      const food = Food.fromFirestore(foodDoc);
      return food;
    })
  );

  const validFoods = foodsWithDetails.filter(food => food !== null);
  
  return validFoods.reduce(
    (total, food) => ({
      calories: total.calories + food.nutrition.cal,
      protein: Math.round((total.protein + food.nutrition.protein) * 10) / 10,
      carbs: Math.round((total.carbs + food.nutrition.carbs) * 10) / 10,
      fat: Math.round((total.fat + food.nutrition.fat) * 10) / 10
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Helper: get nutrition for multiple dates
async function getNutritionForDates(uid, dates) {
  const results = [];
  for (const date of dates) {
    const diet = await fetchDietByDate(uid, date);
    const totalNutrition = await calculateTotalNutrition(diet);
    results.push({ date, totalNutrition });
  }
  return results;
}
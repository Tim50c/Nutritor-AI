// backend/src/controllers/nutritionController.js

/**
 * @desc    Predict nutrition targets based on user data
 * @route   POST /api/v1/nutrition/predict
 * @access  Private
 */
exports.predictNutrition = async (req, res) => {
    try {
        const { age, gender, height, weightCurrent, weightGoal } = req.body;

        // --- Data Validation ---
        if (!age || !gender || !height || !weightCurrent || !weightGoal) {
            return res.status(400).json({ success: false, error: 'Missing required fields: age, gender, height, weightCurrent, weightGoal.' });
        }

        // --- BMR Calculation (Mifflin-St Jeor Equation) ---
        // Assumes height in cm and weight in kg
        let bmr;
        if (gender.toLowerCase() === 'male') {
            bmr = (10 * weightCurrent) + (6.25 * height) - (5 * age) + 5;
        } else { // 'female' or other
            bmr = (10 * weightCurrent) + (6.25 * height) - (5 * age) - 161;
        }

        // --- TDEE (Total Daily Energy Expenditure) Calculation ---
        // Using a "lightly active" multiplier (1.375) as a sensible baseline.
        // For a more advanced app, you could ask the user for their activity level.
        const tdee = bmr * 1.375;

        // --- Calorie Goal Adjustment for Weight Goal ---
        let calorieGoal;
        const weightDifference = weightGoal - weightCurrent;
        
        if (weightDifference < -1) { // Significant weight loss goal
            calorieGoal = tdee - 500;
        } else if (weightDifference > 1) { // Significant weight gain goal
            calorieGoal = tdee + 400;
        } else { // Maintenance
            calorieGoal = tdee;
        }

        // --- Macronutrient Calculation ---
        // Protein: ~1.8g per kg of body weight (good for muscle retention/growth)
        const proteinGrams = 1.8 * weightCurrent;
        const proteinCalories = proteinGrams * 4;

        // Fat: ~25% of total calories (healthy range is 20-35%)
        const fatCalories = calorieGoal * 0.25;
        const fatGrams = fatCalories / 9;

        // Carbs: Remaining calories
        const carbCalories = calorieGoal - proteinCalories - fatCalories;
        const carbGrams = carbCalories / 4;
        
        // --- Fiber Calculation ---
        // Recommended: ~14g per 1000 calories
        const fiberGrams = (calorieGoal / 1000) * 14;

        // --- Assemble and send the response ---
        const result = {
            calories: Math.round(calorieGoal),
            protein: Math.round(proteinGrams),
            carbs: Math.round(carbGrams),
            fat: Math.round(fatGrams),
            fiber: Math.round(fiberGrams),
        };
        
        res.status(200).json({ success: true, data: result });

    } catch (error) {
        console.error("Error in predictNutrition:", error);
        res.status(500).json({ success: false, error: 'Server error while predicting nutrition.' });
    }
};
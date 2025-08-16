const { db, admin } = require('../config/firebase');
const Diet = require('../models/dietModel');

// @desc    Get diet for a specific date
// @route   GET /api/v1/diet
// @access  Private
exports.getDiet = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { date } = req.query;

    const dietDoc = await db.collection('users').doc(uid).collection('diets').doc(date).get();
    const diet = Diet.fromFirestore(dietDoc);

    res.status(200).json({ success: true, data: diet });
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
    const { foodId, quantity } = req.body;
    const date = new Date().toISOString().slice(0, 10);

    const dietRef = db.collection('users').doc(uid).collection('diets').doc(date);
    const dietDoc = await dietRef.get();

    if (!dietDoc.exists) {
      const newDiet = new Diet(date, { cal: 0, protein: 0, carbs: 0, fat: 0 }, []);
      await dietRef.set(newDiet.toFirestore());
    }

    await dietRef.update({
      foods: admin.firestore.FieldValue.arrayUnion({ foodId, quantity, addedAt: new Date() })
    });

    res.status(200).json({ success: true, data: {} });
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
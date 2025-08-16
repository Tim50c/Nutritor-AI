const { db } = require('../config/firebase');
const model = require('../config/gemini');
const openfoodfacts = require('openfoodfacts-nodejs');
const Food = require('../models/foodModel');

// @desc    Recognize food from image
// @route   POST /api/v1/camera/recognize
// @access  Private
exports.recognizeImage = async (req, res, next) => {
  try {
    const { image } = req.body;
    const { uid } = res.locals;

    const result = await model.generateContent([
      'What food is this? Provide only the name of the food.',
      { inlineData: { data: image, mimeType: 'image/jpeg' } }
    ]);

    const foodName = result.response.text();

    const foodsRef = db.collection('foods');
    const querySnapshot = await foodsRef.where('name', '==', foodName).get();

    if (!querySnapshot.empty) {
      const foodDoc = querySnapshot.docs[0];
      res.status(200).json({ success: true, data: { foodId: foodDoc.id } });
    } else {
      const nutritionResult = await model.generateContent([
        `Provide nutrition facts for ${foodName} in JSON format with the following keys: cal, protein, carbs, fat.`,
        { inlineData: { data: image, mimeType: 'image/jpeg' } }
      ]);

      const nutritionResponseText = nutritionResult.response.text();
      const nutritionData = JSON.parse(nutritionResponseText.replace(/```json|```/g, ''));

      const newFood = new Food(
        null,
        foodName,
        null,
        null,
        null,
        nutritionData,
        'gemini',
        uid
      );

      const foodRef = await foodsRef.add(newFood.toFirestore());

      res.status(200).json({ success: true, data: { foodId: foodRef.id } });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Recognize food from barcode
// @route   POST /api/v1/camera/barcode
// @access  Private
exports.recognizeBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.body;

    const client = new openfoodfacts();
    const product = await client.getProduct(barcode);

    if (product) {
      const foodId = product.code;
      const foodRef = db.collection('foods').doc(foodId);
      const foodDoc = await foodRef.get();

      if (!foodDoc.exists) {
        const newFood = new Food(
          foodId,
          product.product_name,
          product.generic_name,
          barcode,
          product.image_url,
          {
            cal: product.nutriments.energy_value,
            protein: product.nutriments.proteins_value,
            carbs: product.nutriments.carbohydrates_value,
            fat: product.nutriments.fat_value
          },
          'original',
          null
        );
        await foodRef.set(newFood.toFirestore());
      }
      res.status(200).json({ success: true, data: { foodId } });
    } else {
      res.status(404).json({ success: false, error: 'Food not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
const { db } = require('../config/firebase');
const model = require('../config/gemini');
const openfoodfacts = require('openfoodfacts-nodejs');
const { SchemaType } = require("@google/generative-ai");
const Food = require('../models/foodModel');

const cleanBase64 = (base64String) => {
  // Remove data URL prefix and any whitespace/newlines
  return base64String
    .replace(/^data:image\/[a-zA-Z]*;base64,/, "")
    .replace(/\s/g, "")
    .replace(/\n/g, "")
    .trim(); // Remove any trailing whitespace
};

// Add validation function
const isValidBase64 = (str) => {
  if (typeof str !== 'string' || str.length === 0) return false;

  // Base64 strings must have length divisible by 4
  if (str.length % 4 !== 0) return false;

  // Regex to strictly match valid Base64 (with optional padding)
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

  return base64Regex.test(str);
};

// @desc    Recognize food details from an image
// @route   POST /api/v1/camera/recognize-details
// @access  Private
exports.recognizeFoodDetails = async (req, res) => {
  console.log('\n--- /camera/recognize-details ENDPOINT HIT (MULTIPART) ---');
  
  try {
    const imageFile = req.file;
    
    console.log('[LOG] Request headers:', req.headers);
    console.log('[LOG] Request body keys:', Object.keys(req.body || {}));
    
    if (imageFile) {
      console.log(`[LOG] Received image: ${imageFile.originalname || 'food-image.jpg'} (${imageFile.mimetype})`);
      console.log(`[LOG] Image size: ${imageFile.size} bytes (${Math.round(imageFile.size / 1024)}KB)`);
    } else {
      console.log('[LOG] No image received.');
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided. Please ensure you are sending the image as FormData with key "image".' 
      });
    }

    // Handle authentication (same as original)
    const { uid } = res.locals || {};
    const userId = uid || 'anonymous-user';
    console.log(`[LOG] User ID: ${userId} (${uid ? 'authenticated' : 'anonymous'})`);

    // Convert to base64 for Gemini API (same as chatbot)
    const base64Image = imageFile.buffer.toString('base64');
    console.log(`[LOG] Base64 length: ${base64Image.length} characters`);

    console.log('[LOG] Sending to Gemini AI for food recognition...');
    
    // First request: Get food name (same pattern as chatbot)
    const nameResult = await model.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            { text: "What food is this? Provide only the name of the food." },
            {
              inline_data: {
                mime_type: imageFile.mimetype,
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    console.log('[LOG] Gemini food name response received');
    const foodName = nameResult.response.text().trim();
    console.log(`[LOG] Recognized food: "${foodName}"`);

    // Check database for existing food
    console.log('[LOG] Checking database for existing food...');
    const foodsRef = db.collection('foods');
    const userFoodQuery = await foodsRef.where('name', '==', foodName).where('userId', '==', userId).get();
    const genericFoodQuery = await foodsRef.where('name', '==', foodName).where('userId', '==', null).get();

    if (!userFoodQuery.empty) {
      console.log('[LOG] Found user-specific food in database');
      const foodDoc = userFoodQuery.docs[0];
      const existingFood = Food.fromFirestore(foodDoc);
      return res.status(200).json({ success: true, data: existingFood });
    } else if (!genericFoodQuery.empty) {
      console.log('[LOG] Found generic food in database');
      const foodDoc = genericFoodQuery.docs[0];
      const existingFood = Food.fromFirestore(foodDoc);
      return res.status(200).json({ success: true, data: existingFood });
    }

    // Generate nutrition details (same as chatbot pattern)
    console.log('[LOG] Generating nutrition details with Gemini...');
    const nutritionResult = await model.generateContent([
      { text: `Provide nutrition facts and description for ${foodName} in this exact JSON format: {"nutrition": {"cal": number, "protein": number, "carbs": number, "fat": number}, "description": "brief description"}` },
      {
        inline_data: {
          mime_type: imageFile.mimetype,
          data: base64Image,
        },
      },
    ]);

    console.log('[LOG] Raw Gemini nutrition response:', nutritionResult.response.text());
    
    // Parse nutrition data
    let detailsData;
    try {
      const responseText = nutritionResult.response.text();
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      detailsData = JSON.parse(cleanedText);
      console.log('[LOG] Parsed nutrition data:', detailsData);
    } catch (parseError) {
      console.error('[ERROR] Failed to parse nutrition JSON:', parseError);
      // Fallback nutrition data
      detailsData = {
        nutrition: { cal: 100, protein: 2, carbs: 20, fat: 1 },
        description: `Estimated nutrition for ${foodName}`
      };
    }

    // Create food object
    const generatedFood = new Food(
      null,
      foodName,
      detailsData.description,
      null,
      null,
      detailsData.nutrition,
      'gemini',
      null
    );

    console.log('[LOG] Sending success response');
    res.status(200).json({ 
      success: true, 
      data: generatedFood,
      message: 'Food recognized successfully'
    });

  } catch (error) {
    console.error('!!! FATAL ERROR IN /camera/recognize-details ENDPOINT !!!', error);
    console.error('[ERROR] Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'An error occurred on the server.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Adds a food to the database
// @route   POST /api/v1/camera/add-food
// @access  Private
exports.addFood = async (req, res) => {
  try {
    const { name, description, barcode, imageUrl, nutrition, source } = req.body;
    const { uid } = res.locals;

    const newFood = new Food(
      null, // ID will be generated by Firestore
      name,
      description,
      barcode,
      imageUrl,
      nutrition,
      source,
      uid // Associate with the current user
    );

    const foodRef = await db.collection('foods').add(newFood.toFirestore());

    res.status(201).json({ success: true, data: { foodId: foodRef.id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Recognize food details from barcode
// @route   POST /api/v1/camera/barcode
// @access  Private
exports.recognizeBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.body;
    const { uid } = res.locals;

    const foodsRef = db.collection('foods');
    const userFoodQuery = await foodsRef.where('barcode', '==', barcode).where('userId', '==', uid).get();
    const genericFoodQuery = await foodsRef.where('barcode', '==', barcode).where('userId', '==', null).get();

    if (!userFoodQuery.empty) {
      const foodDoc = userFoodQuery.docs[0];
      const existingFood = Food.fromFirestore(foodDoc);
      return res.status(200).json({ success: true, data: existingFood });
    } else if (!genericFoodQuery.empty) {
      const foodDoc = genericFoodQuery.docs[0];
      const existingFood = Food.fromFirestore(foodDoc);
      return res.status(200).json({ success: true, data: existingFood });
    }
    
    const client = new openfoodfacts();
    const product = await client.getProduct(barcode);

    console.log('Product details:', product.product_name);


    if (product) {
      const generatedFood = new Food(
        null, // Use barcode as ID for potential saving
        product.product_name,
        product.generic_name,
        product.code,
        product.image_url,
        {
          cal: product.product.nutriments.energy_serving || 0,
          protein: product.product.nutriments.proteins_serving || 0,
          carbs: product.product.nutriments.carbohydrates_serving || 0,
          fat: product.product.nutriments.fat_serving || 0
        },
        'openfoodfacts',
        null
      );
      res.status(200).json({ success: true, data: generatedFood });
    } else {
      res.status(404).json({ success: false, error: 'Food not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Export the uploadImage middleware for use in routes
module.exports.uploadImage = uploadImage;

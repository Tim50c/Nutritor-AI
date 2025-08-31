const { db } = require('../config/firebase');
const model = require('../config/gemini');
const openfoodfacts = require('openfoodfacts-nodejs');
const { SchemaType } = require("@google/generative-ai");
const Food = require('../models/foodModel');

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
    const nameResult = await model.generateContent({
      model: "gemini-2.0-flash",
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
    
    // Only query user-specific foods if userId is available and not anonymous
    if (userId && userId !== 'anonymous-user') {
      const userFoodQuery = await foodsRef.where('name', '==', foodName).where('userId', '==', userId).get();
      if (!userFoodQuery.empty) {
        console.log('[LOG] Found user-specific food in database');
        const foodDoc = userFoodQuery.docs[0];
        const existingFood = Food.fromFirestore(foodDoc);
        return res.status(200).json({ success: true, data: existingFood });
      }
    }
    
    // Query generic foods (userId is null)
    const genericFoodQuery = await foodsRef.where('name', '==', foodName).where('userId', '==', null).get();
    if (!genericFoodQuery.empty) {
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
  console.log('\n--- /camera/barcode ENDPOINT HIT ---');
  
  try {
    const { barcode } = req.body;
    const { uid } = res.locals || {};
    
    console.log('[LOG] Barcode request:', barcode);
    console.log('[LOG] User ID:', uid || 'anonymous');
    
    if (!barcode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Barcode is required' 
      });
    }

    const foodsRef = db.collection('foods');
    
    // Only query user-specific foods if uid is available
    if (uid) {
      const userFoodQuery = await foodsRef.where('barcode', '==', barcode).where('userId', '==', uid).get();
      if (!userFoodQuery.empty) {
        console.log('[LOG] Found user-specific food in database');
        const foodDoc = userFoodQuery.docs[0];
        const existingFood = Food.fromFirestore(foodDoc);
        return res.status(200).json({ success: true, data: existingFood });
      }
    }
    
    // Query generic foods (userId is null)
    const genericFoodQuery = await foodsRef.where('barcode', '==', barcode).where('userId', '==', null).get();
    if (!genericFoodQuery.empty) {
      console.log('[LOG] Found generic food in database');
      const foodDoc = genericFoodQuery.docs[0];
      const existingFood = Food.fromFirestore(foodDoc);
      return res.status(200).json({ success: true, data: existingFood });
    }
    
    console.log('[LOG] Food not found in database, querying OpenFoodFacts...');
    const client = new openfoodfacts();
    const product = await client.getProduct(barcode);

    console.log('[LOG] OpenFoodFacts response:', product?.product_name || 'No product found');

    if (product && product.product_name) {
      const nutrition = product.product?.nutriments || {};
      
      const generatedFood = new Food(
        null,
        product.product_name,
        product.generic_name || `Product with barcode ${barcode}`,
        barcode,
        product.image_url || null,
        {
          cal: Math.round(nutrition.energy_serving || nutrition['energy-kcal_serving'] || nutrition['energy-kcal'] || 0),
          protein: Math.round(nutrition.proteins_serving || nutrition.proteins || 0),
          carbs: Math.round(nutrition.carbohydrates_serving || nutrition.carbohydrates || 0),
          fat: Math.round(nutrition.fat_serving || nutrition.fat || 0)
        },
        'openfoodfacts',
        null
      );
      
      console.log('[LOG] Generated food from OpenFoodFacts:', generatedFood.name);
      res.status(200).json({ 
        success: true, 
        data: generatedFood,
        message: 'Product found in OpenFoodFacts database'
      });
    } else {
      console.log('[LOG] Product not found in OpenFoodFacts');
      res.status(404).json({ 
        success: false, 
        error: 'Product not found',
        message: `Barcode ${barcode} was not found in our database or OpenFoodFacts.`
      });
    }
  } catch (error) {
    console.error('!!! FATAL ERROR IN /camera/barcode ENDPOINT !!!', error);
    console.error('[ERROR] Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

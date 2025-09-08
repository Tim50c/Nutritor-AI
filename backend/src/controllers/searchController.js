const { db } = require('../config/firebase');
const Food = require('../models/foodModel');

// In-memory cache for foods
let foodsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to load all foods into cache
const loadFoodsCache = async () => {
  try {
    console.log('Loading foods cache...');
    const queryRef = db.collection('foods');
    const foodsSnapshot = await queryRef.get();
    
    foodsCache = foodsSnapshot.docs.map(doc => Food.fromFirestore(doc));
    cacheTimestamp = Date.now();
    
    console.log(`✅ Foods cache loaded: ${foodsCache.length} foods`);
    return foodsCache;
  } catch (error) {
    console.error('❌ Error loading foods cache:', error);
    throw error;
  }
};

// Function to get foods from cache (with auto-refresh)
const getFoodsFromCache = async () => {
  if (!foodsCache || !cacheTimestamp || (Date.now() - cacheTimestamp > CACHE_DURATION)) {
    await loadFoodsCache();
  }
  
  return foodsCache;
};

// Initialize cache on server startup
const initializeCache = async () => {
  try {
    console.log('🚀 Initializing foods cache on server startup...');
    await loadFoodsCache();
  } catch (error) {
    console.error('⚠️ Failed to initialize cache on startup:', error);
  }
};

initializeCache();

// @desc    Load all foods into cache
// @route   GET /api/v1/search/load-cache
// @access  Private
exports.loadCache = async (req, res, next) => {
  try {
    await loadFoodsCache();
    res.status(200).json({ 
      success: true, 
      message: `Cache loaded with ${foodsCache.length} foods`,
      count: foodsCache.length
    });
  } catch (error) {
    console.error('Cache loading error:', error);
    res.status(500).json({ success: false, error: 'Failed to load cache' });
  }
};

// @desc    Search foods
// @route   GET /api/v1/search
// @access  Private
exports.searchFoods = async (req, res, next) => {
  try {
    const { query, calo, protein, carbs, fat } = req.query;

    let foods = await getFoodsFromCache();

    if (query && query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      foods = foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm)
      );
    }

    // FIX: Added defensive checks (food.nutrition && ...) to prevent server crash
    // This is the main fix for the fatal bug.
    if (calo) {
      foods = foods.filter(food => food.nutrition && food.nutrition.cal <= parseInt(calo));
    }

    if (protein) {
      foods = foods.filter(food => food.nutrition && food.nutrition.protein <= parseInt(protein));
    }

    if (carbs) {
      foods = foods.filter(food => food.nutrition && food.nutrition.carbs <= parseInt(carb));
    }

    if (fat) {
      foods = foods.filter(food => food.nutrition && food.nutrition.fat <= parseInt(fat));
    }

    res.status(200).json({ success: true, data: foods });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
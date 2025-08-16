const { db } = require('../config/firebase');
const Favorite = require('../models/favoriteModel');

// @desc    Get favorite foods
// @route   GET /api/v1/favorites
// @access  Private
exports.getFavorites = async (req, res, next) => {
  try {
    const { uid } = res.locals;

    const favoritesSnapshot = await db.collection('users').doc(uid).collection('favorites').get();
    const favorites = favoritesSnapshot.docs.map(doc => Favorite.fromFirestore(doc));

    res.status(200).json({ success: true, data: favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Add a favorite food
// @route   POST /api/v1/favorites
// @access  Private
exports.addFavorite = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { foodId } = req.body;

    const favorite = new Favorite(foodId, new Date());

    await db.collection('users').doc(uid).collection('favorites').doc(foodId).set(favorite.toFirestore());

    res.status(201).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Remove a favorite food
// @route   DELETE /api/v1/favorites/:foodId
// @access  Private
exports.removeFavorite = async (req, res, next) => {
  try {
    const { uid } = res.locals;
    const { foodId } = req.params;

    await db.collection('users').doc(uid).collection('favorites').doc(foodId).delete();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
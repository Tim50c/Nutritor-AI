// src/middleware/authMiddleware.js
const { admin } = require('../config/firebase');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // contains uid and other claims
    next();
  } catch (err) {
    console.error('Token verification failed', err);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

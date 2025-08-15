// src/models/calorieLogModel.js
const { db } = require('../config/firebase');

const collectionForUser = (userId) => db.collection('users').doc(userId).collection('calorieLogs');

exports.addLog = async (userId, log) => {
  const docRef = await collectionForUser(userId).add(log);
  const snap = await docRef.get();
  return { id: docRef.id, ...snap.data() };
};

exports.getLogs = async (userId) => {
  const snapshot = await collectionForUser(userId).orderBy('date', 'desc').get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

exports.getLogById = async (userId, id) => {
  const doc = await collectionForUser(userId).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

exports.updateLog = async (userId, id, data) => {
  await collectionForUser(userId).doc(id).update(data);
  return exports.getLogById(userId, id);
};

exports.deleteLog = async (userId, id) => {
  await collectionForUser(userId).doc(id).delete();
  return true;
};

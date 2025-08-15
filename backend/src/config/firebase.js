// src/config/firebase.js
const admin = require('firebase-admin');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // In production you'll store the whole JSON as an env var (stringified)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Local dev: place downloaded serviceAccountKey.json at project root
  serviceAccount = require('../../serviceAccountKey.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();
module.exports = { admin, db };

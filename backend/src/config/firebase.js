const admin = require('firebase-admin');

// TODO: Add your service account key
// const serviceAccount = require('../../serviceAccountKey.json');
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
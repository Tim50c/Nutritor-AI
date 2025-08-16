const { getMessaging } = require('firebase-admin/messaging');

const messaging = getMessaging();

module.exports = messaging;
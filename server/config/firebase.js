const admin = require('firebase-admin');

try {
  const keyJson = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').trim();
  const serviceAccount = keyJson ? JSON.parse(keyJson) : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
} catch (error) {
  console.error('Firebase init error:', error.message);
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

module.exports = admin;

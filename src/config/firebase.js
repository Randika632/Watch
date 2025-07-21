const admin = require('firebase-admin');

let db = null;

// Initialize Firebase Admin SDK 
try {
  // Get service account credentials from environment variable
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? 
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : 
    null;

  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  
  db = admin.database();
  console.log('✅ Firebase connected successfully');
  
} catch (error) {
  console.error('⚠️ Firebase initialization error:', error.message);
  console.log('📝 To enable Firebase features:');
  console.log('   1. Set FIREBASE_SERVICE_ACCOUNT environment variable with the service account JSON');
  console.log('   2. Set FIREBASE_DATABASE_URL environment variable');
  console.log('   3. Restart the server');
  
  // Create a mock db object for development
  db = {
    ref: (path) => ({
      once: async () => ({
        val: () => null
      }),
      limitToLast: () => ({
        once: async () => ({
          val: () => null
        })
      })
    })
  };
}

module.exports = { admin, db }; 
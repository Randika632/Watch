const admin = require('firebase-admin');

let db = null;

// Initialize Firebase Admin SDK 
try {
  const serviceAccount = require('../../serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  
  db = admin.database();
  console.log('✅ Firebase connected successfully');
  
} catch (error) {
  console.log('⚠️ Firebase service account key not found');
  console.log('📝 To enable Firebase features:');
  console.log('   1. Download service account key from Firebase Console');
  console.log('   2. Save as "serviceAccountKey.json" in backend folder');
  console.log('   3. Add FIREBASE_DATABASE_URL to your .env file');
  console.log('   4. Restart the server');
  
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
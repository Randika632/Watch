const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateUserSchema() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    // Update each user with default values for new fields
    for (const user of users) {
      const updates = {
        // Only set fields if they don't exist
        bloodType: user.bloodType || '',
        gender: user.gender || '',
        medicalConditions: user.medicalConditions || [],
        allergies: user.allergies || [],
        medications: user.medications || []
      };

      // Update user
      await User.findByIdAndUpdate(user._id, {
        $set: updates
      }, { new: true });

      console.log(`Updated user: ${user.email}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
updateUserSchema(); 
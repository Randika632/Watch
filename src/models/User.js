const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.isGoogleUser; } },
  googleId: { type: String, unique: true, sparse: true },
  isGoogleUser: { type: Boolean, default: false },
  profilePicture: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  // Profile fields
  age: { 
    type: Number,
    min: 1,
    max: 120
  },
  weight: { 
    type: Number,
    min: 20,
    max: 300
  },
  height: { 
    type: Number,
    min: 50,
    max: 250
  },
  mobile: { 
    type: String,
    match: /^[0-9]{10}$/
  },
  imageUrl: { 
    type: String 
  },
  profileImage: { 
    type: String 
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say', '']
  },
  medicalConditions: {
    type: [String],
    default: []
  },
  allergies: {
    type: [String],
    default: []
  },
  medications: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 
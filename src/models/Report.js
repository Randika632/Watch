const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  // Missing person specific fields
  name: {
    type: String,
    trim: true
  },
  age: {
    type: String,
    trim: true
  },
  lastSeen: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Missing Person', 'Crime', 'Accident', 'Other'],
    default: 'Missing Person'
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Closed'],
    default: 'Active'
  },
  images: [{
    type: String, // URLs to stored images
    required: false
  }],
  responses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Response'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema); 
const mongoose = require('mongoose');

const healthSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  heartRate: { type: Number, required: true },
  systolic: { type: Number, required: true },
  diastolic: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Health', healthSchema); 
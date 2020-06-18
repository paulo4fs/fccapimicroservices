const mongoose = require('mongoose');
const User = require('./userModel');

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: Date.now,
  },
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;

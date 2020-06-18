const mongoose = require('mongoose');
const Exercise = require('./exerciseModel');

const userSchema = new mongoose.Schema({
  username: String,
  exercise: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Exercise',
    },
  ],
});

userSchema.pre(/^find/, function (next) {
  this.populate('exercise');
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

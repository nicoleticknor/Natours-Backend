const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please tell us your email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    // he hasn't done any validation here yet
    // validate: {
    //   validator: function (val) {
    //     return val === this.password;
    //   },
    //   message: 'Password confirmation does not match password',
    // },
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;

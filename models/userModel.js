const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    // !! This only works on the create and save methods, not the update method
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Password confirmation does not match password',
    },
  },
});

//doing encryption on the model (rather than the controller), because it's to do with the data, rather than the business logic
userSchema.pre('save', async function (next) {
  //gate clause to exit out of this function if the password hasn't changed
  if (!this.isModified('password')) return next();

  //The default salting value is 10, but since computer CPU power has increased over the years, it's better to use 12 now
  //need to make this async  so we don't block the event loop from other users saving their information
  this.password = await bcrypt.hash(this.password, 12);

  //we only needed this field for the signup validation. Once we click save, we want to delete that / not persist it in the database, so we are setting it to undefined
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

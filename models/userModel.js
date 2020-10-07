const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
// node's built in encryption module
const crypto = require('crypto');

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
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    //this prevents this from being returned to the client on sign in
    select: false,
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
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
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

// creating an instance method that will be available on all instances of the User model (all User documents)
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // this.password is not available because we have it as select: false, that's why we need to pass in the userPassword
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // will return true or false
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

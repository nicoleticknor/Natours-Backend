const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // specifying each field for security (to avoid someone writing to the admin field)
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  // const email = req.body.email;
  // const password = req.body.password;
  const { email, password } = req.body; // ES6 destructuring

  // 1) check if email and password was provided
  if (!email || !password)
    return next(new AppError('Please provide email and password', 400));

  // 2) check if user exists && if password is correct
  // since we have select: false turned on for the password field, we have to select it with the + at the beginning of the string
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) if no error, send the token to the client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'status',
    token,
  });
});

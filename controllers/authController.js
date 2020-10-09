const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
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
    // !! why doesn't the database persist this field?
    passwordChangedAt: req.body.passwordChangedAt,
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

exports.protect = catchAsync(async (req, res, next) => {
  // 1) verify token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) validate token with JWT
  // this is async, so we are going to convert this into a promise using promisify, so that it fits into our catchAsync function
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  //note that error handling here happens in the errorController; we don't need to pass it anything because JWT will throw the error.

  // 3) Check if user still exists (so you can't use a token after a user deletes their account)
  const currentUser = await User.findById(decodedToken.id);
  console.log(currentUser);

  if (!currentUser) {
    return next(
      // !! Mongoose is doing something in the findById method that errors out before this can happen.
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 4) Check if user changed password after token was issued (because if they did, they will need a new token under the new password)
  // if true, throw error
  if (currentUser.changedPasswordAfter(decodedToken.iat)) {
    return next(
      new AppError('User recently changed password Please log in again.', 401)
    );
  }

  // 5) Grant access to protected route
  // we are going to use this user info later as part of the authorization processes
  req.user = currentUser;
  next();
});

//we need a way to pass arguments admin and lead-guide into this middleware, which we can't just do. So we need a wrapper function that accepts the array of roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  // 2) Generate random reset token
  const resetToken = user.createPasswordResetToken();
  //we call the instance method which updates the two attributes of the user, but we have to save them to persist it into the database
  //we have to use this option because if we don't provide an email and a password, we will fail the validation on the save method
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // 4) using a try catch block because we have to do more in the event of an error than just send the error message to the client. we need to wipe some data.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on token from the route param /:token
  // the token is stored encrypted in the db, so we need to encrypt what we get from req.params
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has not expired and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 3) update password-related properties for current user (changedPasswordAt will be updated in the middleware, so that we can reuse it for the other password change handler that will be built later)
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //we run save because we want to run all the validators and the save middleware function that encrypts passwords
  await user.save();

  // 4) Log the user in; send JWT to client
  const token = signToken(user._id);

  res.status(200).json({
    status: 'status',
    token,
  });
});

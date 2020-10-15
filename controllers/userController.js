const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // check if each object key is one of the allowed fields
  Object.keys(obj).forEach((e) => {
    if (allowedFields.includes(e)) newObj[e] = obj[e];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //password update is in another handler in the authController

  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }
  // 2) Update user document
  /* we can't just use the update to be req.body, because then someone could force update their role to admin for example.
  so we specify which fields are allowed to be updated in the function arguments */
  const filteredBody = filterObj(req.body, 'name', 'email');
  // we can use findByIdAndUpdate now because we aren't dealing with passwords/sensitive data that needs the save middleware to run
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    // new set to true so that it returns the updated object, not the old one
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// to allow the getMe route to use the factory function with the user object instead of req.params
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// !! do NOT update passwords with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

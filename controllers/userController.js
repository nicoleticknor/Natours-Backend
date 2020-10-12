const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // check if each object key is one of the allowed fields
  Object.keys(obj).forEach((e) => {
    if (allowedFields.includes(e)) newObj[e] = obj[e];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  // not adding a 404 error here because technically, 0 results that match the filters that the client requested is not an error, if there is zero documents in the database that meet those criteria

  // ?? SEND RESPONSE
  res.status(200).json({
    status: 'success',
    //good practice to do this when sending an array / multiple objects
    results: users.length,
    data: { users },
  });
});

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

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

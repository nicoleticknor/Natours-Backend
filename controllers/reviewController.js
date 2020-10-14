const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// getting all reviews
exports.getAllReviews = catchAsync(async (req, res, next) => {
  // 1) check if there's a tour id coming in from the params (mergeparams) and assign it to a variable
  let filter;
  if (req.params.tourId) filter = { tour: req.params.tourId };

  // 2) pass the variable to find
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

// * old format to create new reviews
/*
exports.createReview = catchAsync(async (req, res, next) => {
  // to allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  //we get the user object from the protect middleware
  if (!req.body.user) req.body.user = req.user.id;
  const newReview = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { Review: newReview },
  });
});
*/

// * new format for creating reviews - factory functions
//middleware to grab user Id and tour Id
exports.setTourUserIds = (req, res, next) => {
  // to allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  //we get the user object from the protect middleware
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

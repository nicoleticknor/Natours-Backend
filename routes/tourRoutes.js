const express = require('express');

const router = express.Router();
//instead of destructuring, just importing the whole exports object
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require("./reviewRoutes");

// param middleware on a specific parameter. val is value of parameter in question.
//so if "id" is present in the URL, this logic will trigger
router.param('id', (req, res, next, val) => {
  console.log(`Tour ID is: ${val}`);
  next();
});

// * nested route without using express mergeparams
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

// * nested route using express
// for this specific route, we want to use the review router.
// This is mounting a router onto a mounted router.
// we can do this because a router is also middleware
// we also have to give the review router access to the /:tourId param - see reviewRoutes.js
// !! have to put this at the bottom?
router.use('/:tourId/reviews', reviewRouter);

//adding aliasing for a popular route using middleware
router
  .route('/top-5-best')
  .get(tourController.aliasTopTours, tourController.getAllTours);

//the route for the aggregate pipeline
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  //implementing middleware to protect browse tours from inauthenticated users
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;

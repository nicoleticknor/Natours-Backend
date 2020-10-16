const express = require('express');

const router = express.Router();
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

// * param middleware on a specific parameter. val is value of parameter in question.
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
router.use('/:tourId/reviews', reviewRouter);

//* aliasing for a popular route using middleware
router
  .route('/top-5-best')
  .get(tourController.aliasTopTours, tourController.getAllTours);

//* route for the aggregate pipeline
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

//* route for finding tours within a specific radius
// this is the standard way of specifying a url that contains a lot of options, rather than making them into a query string
router
  .route('/tours-within/:distance/centre/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

// * routes for all tours
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

// * routes for a specific tour
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;

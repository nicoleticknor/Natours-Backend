const express = require('express');

const router = express.Router();
//instead of destructuring, just importing the whole exports object
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

// param middleware on a specific parameter. val is value of parameter in question.
//so if "id" is present in the URL, this logic will trigger
router.param('id', (req, res, next, val) => {
  console.log(`Tour ID is: ${val}`);
  next();
});

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

const express = require('express');

const router = express.Router();
//instead of destructuring, just importing the whole exports object
const tourController = require('../controllers/tourController');

// param middleware on a specific parameter. val is value of parameter in question.
//so if "id" is present in the URL, this logic will trigger
router.param('id', (req, res, next, val) => {
  console.log(`Tour ID is: ${val}`);
  next();
});

//invoking the ID check param middleware. Using the middleware pipeline for this keeps our code DRY
//removing this now that we've moved from fs to mongo
// router.param("id", (tourController.checkID));

//adding aliasing for a popular route using middleware
router
  .route('/top-5-best')
  .get(tourController.aliasTopTours, tourController.getAllTours);

//the route for the aggregate pipeline
router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/')
  .get(tourController.getAllTours)
  // this is how we invoke the checkBody middleware, since it's not based on the parameters but rather is in the post function
  //removing this now that we've moved from fs to mongo
  // .post(tourController.checkBody, tourController.createTour);
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;

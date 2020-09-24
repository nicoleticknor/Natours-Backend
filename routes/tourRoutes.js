const express = require("express");
const router = express.Router();
//instead of destructuring, just importing the whole exports object
const tourController = require("../controllers/tourController");

// param middleware on a specific parameter. val is value of parameter in question.
//so if "id" is present in the URL, this logic will trigger
router.param("id", (req, res, next, val) => {
  console.log(`Tour ID is: ${val}`);
  next();
});

//removing this now that we've moved from fs to mongo
//invoking the ID check param middleware. Using the middleware pipeline for this keeps our code DRY
// router.param("id", (tourController.checkID));

router
  .route("/")
  .get(tourController.getAllTours)
  // this is how we invoke the checkBody middleware, since it's not based on the parameters but rather is in the post function
  .post(tourController.checkBody, tourController.createTour);

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;

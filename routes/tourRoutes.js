const express = require("express");
const router = express.Router();
//instead of destructuring, just importing the whole exports object
const tourController = require("../controllers/tourController");

// param middleware on a specific parameter. val is value of parameter in question
router.param("id", (req, res, next, val) => {
  console.log(`Tour ID is: ${val}`);
  next();
});

//invoking the ID check param middleware. Using the middleware pipeline for this keeps our code DRY
router.param("id", (tourController.checkID));

router
  .route("/")
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;

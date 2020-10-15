const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// * these options allow this router access to the params in other routers
// see tourRoutes.js for more info
const router = express.Router({ mergeParams: true });

// * must be authenticated to access any review routes (outside of calling Get All Tours)
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

// * preventing guides from being able to edit or delete reviews
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;

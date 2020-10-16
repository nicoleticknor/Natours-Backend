const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review must have a rating'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    // ?? this is how to implement a parent reference

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// * to populate user data in parent queries
reviewSchema.pre(/^find/, function (next) {
  // to populate tour and user info when querying reviews. However this clutters the tour query with the review virtual populate

  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  // this de-clutters the tour query so that the reviews don't contain duplicate into about the tour within them
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// * calculating ratingsAverage based on review ratings for that tourId
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // in static methods, this keyword points to the model directly. So we can call aggregate
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // * persist the calculation to the database
  // if the stats array is empty (as the case would be upon deleting the one and only review on a tour), then stats[0] will be undefined
  // therefore undefined.nRating would cause an error, so guard clause against this
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      // this is the default rating upon creating a new tour
      ratingsAverage: 4.5,
    });
  }
};

// * middleware to calculate the average rating
// needs to be a post method because we need to have access to all the reviews (after saving the new one)
// remember, post doesn't get access to next()
reviewSchema.post('save', function () {
  // this keyword points to current review, but constructor points to the model, which we haven't defined yet in a variable
  this.constructor.calcAverageRatings(this.tour);
});

// * persisting the average rating in the database
// findByIdAndUpdate and findByIdAndDelete only have query middleware available (we can't post with it), which are pre methods
// we need to grab the review document so that we can access the tour ID and the constructor method calcAverageRatings after the post method above happens, and then pass that to the next middleware which is a post method
// we are using a pre on the findOneAnd(update, delete) methods because that's how the findByIdAnd... methods work behind the scenes
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this keyword is the current *query* (the regex argument), not the document (the review). so we want to execute the query to get access to the document
  // we are storing the review document to this.r so that it is accessible in the next middleware (on the this keyword)
  this.r = await this.findOne();
  next();
});
// * persisting the average rating in the database, continued
// this post method is where we actually do the updating
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne() does not work here; query has already been executed
  // from this.r we have access to the constructor methods
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

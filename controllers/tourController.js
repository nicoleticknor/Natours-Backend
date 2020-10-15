const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// ** Aliasing for a popular route - middleware
//search for the five best tours, sorted by price. query string would be limit=5&sort=-ratingsAverage,price
//when someone hits the route tours/top-5-best, the first function that triggers is this one which sets the query string to this
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  //-ratingsAverage means "best", and the price sort means within those that have the same ratingsAverage, sort by price ascending
  req.query.sort = '-ratingsAverage,price';
  //these are the fields it will request the next function to limit to
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// * see previous commits for comments explaining the populate method
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//MongoDB has a data aggregation pipeline that we can use for all kinds of data calcs
exports.getTourStats = catchAsync(async (req, res, next) => {
  //see mongo docs for various pipeline stage
  const stats = await Tour.aggregate([
    {
      //this is a prelim step to grab only a certain set of data
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      // this stage groups docs together using accumulators, and we can use that data to calculate things like average, max/min, etc
      $group: {
        //we always need to specify _id because this is the "group by" piece
        //there are other mongodb operators such as toUpper than you can specify for the results data
        //if you want to group by all the tours that passed the match stage, leave it set to null (without any weird syntax)
        _id: { $toUpper: '$difficulty' },
        //for each document that gets aggregated, we are accumulating a count of 1 to the sum of numTours
        numTours: { $sum: 1 },
        //pay attention to the mongoDB syntax
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $min: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    //we have to use the group name instead of the field name here
    //the 1 here means ascending
    //for demonstration purposes - we can match again to grab only a certain set of data out of the previous pipeline stages
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      //unwind stage deconstructs an array field from the input documents and then output one document for each element of the array
      // so we if we have three "start dates" in the field startDates for the tour The Forest Hiker, we will get three results named The Forest Hiker, each with their own start date.
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        //mongo has a built in date operator. we want to grab the month from the field startDates
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        //this is how we create an array in the results
        tours: { $push: '$name' },
      },
    },
    {
      //this is like AS in SQL - it adds a new field called whatever you want, and the value is whatever you specify
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        // 0 will hide the field, 1 will show it. hiding ID because we are aliasing it as "month"
        _id: 0,
      },
    },
    {
      //-1 is for descending, 1 is for ascending
      $sort: { numTourStarts: -1 },
    },
    {
      //this is redundant, but it's here for demonstation that we can limit here too.
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

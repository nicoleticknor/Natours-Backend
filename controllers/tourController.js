const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
//could have put catchAsyn directly in the router, but then if one of the handlers was not async, it would be tricky to debug
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

exports.getAllTours = catchAsync(async (req, res, next) => {
  // ?? EXECUTE QUERY
  //the constructor needs a query and query string. The query is Tour.find(), and the query string comes from the request
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  //have to call the class method now instead of the query variable we set up before
  const tours = await features.query;

  // not adding a 404 error here because technically, 0 results that match the filters that the client requested is not an error, if there is zero documents in the database that meet those criteria

  // ?? SEND RESPONSE
  res.status(200).json({
    status: 'success',
    //good practice to do this when sending an array / multiple objects
    results: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // !! why does this error out with an undefined tour before the console log when there is no tour?

  // ?? using the populate method to fill out child reference data in the query
  // adding the populate method will populate the data about whatever parameter is passed in that is a child reference
  // * can be done simply by specifying the path:
  // const tour = await Tour.findById(req.params.id).populate('guides');
  // * or by passing in an options object:
  // const tour = await Tour.findById(req.params.id).populate({
  //   path: 'guides',
  //   select: '-__v -passwordChangedAt',
  // });
  // * or as middleware, because we want it to run on every find method for the tours schema (see tourModel)
  const tour = await Tour.findById(req.params.id).populate('reviews');
  // console.log(tour);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

// * previous delete handler
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

// * Delete using the factory function
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

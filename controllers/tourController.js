const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

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

exports.getAllTours = async (req, res) => {
  try {
    // ?? EXECUTE QUERY
    //the constructor needs a query and query string. The query is Tour.find(), and the query string comes from the request
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //have to call the class method now instead of the query variable we set up before
    const tours = await features.query;

    // ?? SEND RESPONSE
    res.status(200).json({
      status: 'success',
      //good practice to do this when sending an array / multiple objects
      results: tours.length,
      data: { tours },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    //this is a helper function Tour.findOne({_id: req.params.id})
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    //calling the create method on the model we created in the model file
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { tour: newTour },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      // temporary error handling until we do something more meaningful later
      message: 'Invalid data sent',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    //another helper method from mongoose. see mongoose docs for explanation
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

//MongoDB has a data aggregation pipeline that we can use for all kinds of data calcs
exports.getTourStats = async (req, res) => {
  try {
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
        //we have to use the group name instead of the field name here
        //the 1 here means ascending
        $sort: { avgPrice: 1 },
      },
      //for demonstration purposes, we can match again to grab only a certain set of data out of the previous pipeline stages
      {
        $match: { _id: { $ne: 'EASY' } }
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

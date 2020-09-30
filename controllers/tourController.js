const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    // ?? BUILD QUERY
    // ** Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //since we are using the find method with queryObj, and queryObj may come in with sort, limit, etc, we need to strip those out. Because none of our documents in this collection has those fields, obviously
    excludedFields.forEach(f => delete queryObj[f]);

    // ** ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);

    //use regex to grab the query params and add the $ in front of the operator as in mongoDB query language
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    //need to use JSON in the find method
    let query = Tour.find(JSON.parse(queryStr));

    // ** Sorting
    //since we stripped sort out of the queryObj, we will just look at the query params again as they came in for a sort k:v pair
    if (req.query.sort) {
      // console.log(req.query.sort); // -price,-ratingsAverage (for example)
      // this split/join is to translate the query string comma "," between the fields into a mongoose-friendly space " " (see mongoose docs on sort method for syntax)
      const sortBy = req.query.sort.split(',').join(' ');
      //the sort method of the query object is a mongoose "query builder" thing
      query = query.sort(sortBy);
    } else {
      //creating a default sort parameter in case the user does not specify
      query = query.sort('-createdAt');
    }

    // ** Limiting search fields returned
    if (req.query.fields) {
      //again, the select method expects a space instead of a comma
      const fields = req.query.fields.split(',').join(' ');
      //so we only get the fields the user selects
      query = query.select(fields);
    } else {
      //default - we want all fields, but only all useful fields. since mongoose automatically includes a __v field for each document, and we don't want to disable that strictly, we will exclude them in the else/default case
      //the minus operator will exlude the field; this will select everything except the __v fields
      query = query.select('-__v');
    }

    // ** Pagination and limiting results per page
    // the query string looks like ?page=2&limit=10 for example

    //skip is the amount of results that should be skipped before querying data, and limit is the amount of results that we want to be returned
    //so we need to calculate the skip value based on the page and limit values

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    //gate clause in case they search out of limit
    if (req.query.page) {
      //this will resolve to the number of documents that exist in the db
      const numTours = await Tour.countDocuments();
      //we need to send an error here so that we don't error out of the try block that we're in, and go to the catch block
      //we will do better error handling soon to replace this
      if (skip >= numTours) {
        res.status(404).json({
          status: 'failed',
          message: 'This page does not exist',
        });
      }
    }

    // ?? EXECUTE QUERY
    const tours = await query;

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

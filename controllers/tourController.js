const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    // BUILD QUERY
    //Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(f => delete queryObj[f]);

    // ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);

    // if we were to look for duration of at least 5 days, this is what the mongoDB query would look like. Can also see this in the console log if the route includes that in the query string
    // { difficulty: 'easy', duration: { $gte: 5 } }

    //so we can use regex to grab the query params and add the $ in front of the operator
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    //the object passed into the find method can be the req.query object, or the queryObj copy without the excluded fields, or the queryStr variable we interpolated the $ into
    let query = Tour.find(JSON.parse(queryStr));

    // Sorting

    if (req.query.sort) {
      // this split/join is to translate the query string , into a mongoose-friendly space
      const sortBy = req.query.sort.split(',').join(' ');
      //the sort method of the query object is a mongoose "query builder" thing
      query = query.sort(sortBy)
    } else {
      //creating a default sort parameter if the user does not specify
      query = query.sort('-createdAt');
    }

    //keeping this in for now because we can use it to see sort, paging, limit etc coming in from the query string in postman
    console.log(JSON.parse(queryStr));

    // EXECUTE QUERY
    const tours = await query;

    //SEND RESPONSE
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

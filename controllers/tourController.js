const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    // BUILD QUERY
    const queryObj = { ...req.query };
    // we are going to implement paging, sorting, limiting, etc as part of our browse functionality later, so we don't want those to be valid filter query params
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach(f => delete queryObj[f]);
    // console.log(req.query, queryObj);

    //you can filter queries with an object in the find method
    // const tours = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy',
    // })

    //NB you can also filter queries with method chains like this one
    // const tours = Tour.find()
    // .where('duration')
    // .equals(5)
    // .where('difficulty')
    // .equals('easy')

    //the object passed into the find method can be the req.query object, or the queryObj copy without the excluded fields
    //we are going to add sorting, paging, etc later, so we need to add a middle step where we save the resulting query object to a variable so we can chain those methods onto it later, as it's done in the code block above
    const query = Tour.find(queryObj);

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

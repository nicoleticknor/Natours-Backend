const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    //same as when we query the MongoDB with the terminal, we use the find method
    const tours = await Tour.find();

    res.status(200).json({
      status: 'success',
      //do this when sending an array / multiple objects
      results: tours.length,
      data: { tours }, //tours: tours (ES6)
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    })
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

exports.updateTour = (req, res) => {
  //not actually going to implement this right now b/c that's a lot of fs methods; will do this later with the actual DB

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<updated tour here...>',
    },
  });
};

exports.deleteTour = (req, res) => {
  //won't actually do this right now; we will wait til the DB is up
  res.status(204).json({
    status: 'success',
    data: null,
  });
};

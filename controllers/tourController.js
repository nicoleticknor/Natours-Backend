const Tour = require('../model/tourModel');

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    //do this when sending an array / multiple objects
    // results: tours.length,
    // data: { tours }, //tours: tours (ES6)
  });
};

exports.getTour = (req, res) => {
  //note that /:x/:y?/:z will give back x y and z as params too, where y is optional (? modifier)
  const id = Number(req.params.id);
  // const tour = tours.find((e) => e.id === id);

  // res.status(200).json({
  //   status: 'success',
  //   data: { tour },
  // });
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

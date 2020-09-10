const fs = require("fs");

const tours = JSON.parse(
  fs.readFileSync(`dev-data/data/tours-simple.json`),
);

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    //do this when sending an array / multiple objects
    results: tours.length,
    data: { tours }, //tours: tours (ES6)
  });
};

exports.getTour = (req, res) => {
  //note that /:x/:y?/:z will give back x y and z as params too, where y is optional (? modifier)

  const id = Number(req.params.id);

  const tour = tours.find((e) => e.id === id);

  // temp guard clause
  if (!tour) {
    return res.status(404).json({
      status: "failed",
      message: "invalid id",
    });
  }

  res.status(200).json({
    status: "success",
    data: { tour },
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  // doing it this way so we don't mutate the original body object
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  //don't use writeFileSync so that we don't block the event loop
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: "success",
        data: { tour: newTour },
      });
    },
  );
};

exports.updateTour = (req, res) => {
  //not actually going to implement this right now b/c that's a lot of fs methods; will do this later with the actual DB

  const id = req.params.id;

  if (id > tours.length) {
    return res.status(404).json({
      status: "failed",
      message: "invalid id",
    });
  }
  res.status(200).json({
    status: "success",
    data: {
      tour: "<updated tour here...>",
    },
  });
};

exports.deleteTour = (req, res) => {
  //won't actually do this right now; we will wait til the DB is up
  const id = req.params.id;

  if (id > tours.length) {
    return res.status(404).json({
      status: "failed",
      message: "invalid id",
    });
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
};

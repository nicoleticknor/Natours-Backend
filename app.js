const fs = require("fs");
const express = require("express");
const morgan = require("morgan");

const app = express();

// * Middlewares

//app.use adds middleware to the "middleware stack" which happens in a chain for every request (unless a specific route is specified)
// NB you can use morgan's logger to save the outputs to a location
app.use(morgan("dev"));

//this is express' built-in body parser
app.use(express.json());

//defining our own middleware that will apply to every request (because we don't specify a route)
//note that code order matters in the middleware stack - this will get executed in order, so if the route comes before this, this will never happen (because the route will send a response which terminates the request/response cycle)
app.use((req, res, next) => {
  console.log("hello from the middleware 🙌");
  //have to call the next function at the end of our own middlware functions, otherwise the server will just hang. need to move to the next middleware function
  next();
});

app.use((req, res, next) => {
  //creating a k/v in the req object that we can call later in another middleware function (in this case, the route itself)
  req.requestTime = new Date().toISOString();
  next();
});

// * Route handlers

//since the data is local, reading this into a variable first so that it's not blocking when the route api/v1/tours is called
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`),
);

const getAllTours = (req, res) => {
  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    //do this when sending an array / multiple objects
    results: tours.length,
    data: { tours }, //tours: tours (ES6)
  });
};

const getTour = (req, res) => {
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

const createTour = (req, res) => {
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

const updateTour = (req, res) => {
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

const deleteTour = (req, res) => {
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

// * Routes

// app.get("/api/v1/tours", getAllTours);
// app.get("/api/v1/tours/:id", getTour);
// app.post("/api/v1/tours", createTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

// specifying v1 so that the API can be changed and not break for users who still use v1
//doing it this way we can chain all the methods for each route, so that it's neater than the above
app
  .route("/api/v1/tours")
  .get(getAllTours)
  .post(createTour);

app
  .route("/api/v1/tours/:id")
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

// * Server

const port = 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

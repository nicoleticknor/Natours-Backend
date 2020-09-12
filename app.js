const express = require("express");
const morgan = require("morgan");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

// * Middlewares

//app.use adds middleware to the "middleware stack" which happens in a chain for every request (unless a specific route is specified)
// NB you can use morgan's logger to save the outputs to a location
app.use(morgan("dev"));

//this is express' built-in body parser
app.use(express.json());

//to allow our markup and style sheets
app.use(express.static(`${__dirname}/public`));

//defining our own middleware that will apply to every request (because we don't specify a route, as we do with mounting below)
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

//* Routes

//creating a route-specific middlware that we can mount our routes on.
//this is how we can export these into separate files and then just call tourRouter.get('/') for that whole /api/v1/tours route piece
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;

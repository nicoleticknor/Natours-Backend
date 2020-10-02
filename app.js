// ?? Express App file

const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// * Middlewares
//app.use adds middleware to the "middleware stack" which happens in a chain for every request (unless a specific route is specified)

//to only use morgan when we are in development environment
if (process.env.NODE_ENV === 'development') {
  // NB you can use morgan's logger to save the outputs to a location
  app.use(morgan('dev'));
}

//this is express' built-in body parser
app.use(express.json());

//to allow our markup and style sheets
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  //creating a k/v in the req object that we can call later in another middleware function (in this case, the route itself)
  req.requestTime = new Date().toISOString();
  next();
});

//* Routes

//creating a route-specific middlware that we can mount our routes on.
//this is how we can export these into separate files and then just call tourRouter.get('/') for that whole /api/v1/tours route piece
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//adding middleware here to catch any route requests that aren't handled by the two routes above. We have to put this here at the bottom because order matters in routes (if we put it above, everything would be handled with this catch-all route)
//all method will run for 'all' the CRUD verbs, and the wildcard * will handle any text
app.all('*', (req, res, next) => {
  //whenever an argument is passed into next(), express assumes to be an error so it will skip all the other middlewares and go to our global error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

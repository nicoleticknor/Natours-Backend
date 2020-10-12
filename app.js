// ?? Express App file

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// * Middlewares
//app.use adds middleware to the "middleware stack" which happens in a chain for every request (unless a specific route is specified)

// ?? Set Security HTTP headers
//Use this package early in the middleware stack. It's a collection of 14 smaller middlewares and is best practice to use in all apps
app.use(helmet());

// ?? Development logging
//to only use morgan when we are in development environment
if (process.env.NODE_ENV === 'development') {
  // NB you can use morgan's logger to save the outputs to a location
  app.use(morgan('dev'));
}

// ?? limit requests from same IP
const limiter = rateLimit({
  //number of requests
  max: 100,
  //per milliseconds
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour',
});
//the limiter will only apply to the routes that start with /api
app.use('/api', limiter);

// ?? Body parser, reading data from body into req.body
//this is express' built-in body parser. Won't accept bodies larger than 10kb
app.use(express.json({ limit: '10kb' }));

// ?? Data sanitization against NOSQL query injection
//this library goes through all the body data and removes dollar signs
app.use(mongoSanitize());

// ?? Data sanitization against XSS (cross-site scripting attacks)
/*mongo is already a good protection against XSS because validation on the schemas prevents this type of thing
but we'll use this library anyway*/
app.use(xss());

// ?? Prevent parameter pollution
/* clears up the query string so that if we have duplicate/conflicting filters, it still processes the last one
white-listing an array of properties that we actually want to allow for dupes in the query string
we could do something more complex than manually entering this array, but we are just keeping this simple */
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// ?? to allow serving static files - our markup and style sheets
app.use(express.static(`${__dirname}/public`));

// ?? test middleware
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

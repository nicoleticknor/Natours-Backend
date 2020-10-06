//implementing one middleware for all error handling
//express has built-in middleware for error handling, just specify err in the callback

const AppError = require('../utils/appError');

const handleIDErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  // loop over the errors and map only their message properties
  const errors = Object.values(err.errors).map(e => e.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);

const sendErrorDev = (err, res) => {
  //we may have a status code and a message from our other error handling set up next(err)
  res.status(err.statusCode || 500).json({
    status: err.status || 'failed',
    error: err,
    message: err.message || 'error',
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log('Operational');
    res.status(err.statusCode || 500).json({
      status: err.status || 'failed',
      message: err.message || 'error',
    });

    // Programming or other unknown error: don't leak details to client
  } else {
    // 1) Log error
    console.error('error 💥:', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

module.exports = (err, req, res, next) => {

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    console.log('err.name:', err.name);
    // MongoDB errors will be Operational, but will not be marked as such in our code, so we have to account for them here. There are three types we are building handler blocks for
    // 1) Invalid ID
    if (error.path === '_id') {
      error = handleIDErrorDB(error);
    }
    // 2) Duplicate field names in Create
    if (error.code === 11000) error = handleDuplicateErrorDB(error);
    // 3) Validation Errors in Update
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    sendErrorProd(error, res);
  }
};

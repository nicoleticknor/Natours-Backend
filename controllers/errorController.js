//implementing one middleware for all error handling
//express has built-in middleware for error handling, just specify err in the callback

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
    // !! for this mongoose error, why is message called "CastError" when logging the whole object, but not when logging it directly?
    console.error('error 💥:', err, 'error message:', err.message);

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
    sendErrorProd(err, res);
  }
};

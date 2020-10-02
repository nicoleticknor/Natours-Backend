//implementing one middleware for all error handling
//express has built-in middleware for error handling, just specify err in the callback
module.exports = (err, req, res, next) => {
  //we may have a status code and a message from our other error handling set up next(err)
  res.status(err.statusCode || 500).json({
    status: err.status || 'failed',
    message: err.message || 'error',
  });
};

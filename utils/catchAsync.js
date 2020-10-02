//creating a function wrapper for the async route logic that contains a standard error handler
module.exports = (fn) => {
  // need to return an anonymous function with this logic, which has a .catch a(because it returns a promise that we can chain that on, because the function passed into it is async)
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};

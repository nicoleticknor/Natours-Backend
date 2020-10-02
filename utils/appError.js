class AppError extends Error {
  constructor(message, statusCode) {
    //call super with message because it's the only param that the built-in Error class accepts. The parent call here will set the message call to the incoming message without having to set it using this.message
    super(message);

    this.statusCode = statusCode;

    //this way we can derive the status from the status code without having to pass it in
    this.status = `${statusCode}`.startsWith('4') ? 'failed' : 'error';
    //this way we can test for this property, and only send the error back to the client when this property is true. Some other errors can happen, like a bug in a package or something, and then we won't bomb out our handler with errors that are incompatible with this class' logic
    this.isOperational = true;

    //this will log the stack trace to the console, but exclude the function call that happened when the error instance was created
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

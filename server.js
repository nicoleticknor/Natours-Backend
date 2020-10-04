const mongoose = require('mongoose');
//need to require and config this first before we try to run the app so that we get the correct variables
//since morgan is dependent on the dev environment variable, morgan won't work if app is declared first
const dotenv = require('dotenv');

//Some devs think these global handlers are a bad idea, but they are a safety net. Should also handle the error right where the error occurs (for example put a catch statement in the DB connection block)
//putting this one at the top, because uncaught exceptions could happen at any part in the thread
process.on('uncaughtException', err => {
  console.log('Uncaught Exception. Shutting down...');
  console.log('error name:', err.name, 'error message: ', err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    // to prevent Deprecation Warning from mongoose
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// Node's built-in event handler
process.on('unhandledRejection', err => {
  console.log('error name:', err.name, 'error message: ', err.message);
  console.log('Unhandled Promise Rejection. Shutting down...');
  //close the server before disconnecting
  server.close(() => {
    //then disconnect. this crashes the app.
    process.exit(1);
  });
});

//example uncaught exception
// console.log(x);

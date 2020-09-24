const mongoose = require('mongoose');
//need to require and config this first before we try to run the app so that we get the correct variables
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

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

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

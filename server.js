const mongoose = require('mongoose');
//need to require and config this first before we try to run the app so that we get the correct variables
const dotenv = require('dotenv');

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

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
  },
  rating: {
    type: Number,
    //default here just for demonstrative purposes
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
});

//this is the "model" that we create out of the Schema
const Tour = mongoose.model('Tour', tourSchema);

//this is a new "document" that we create out of the tour "model"
// this will only allow one instance of the document in the database because the tour name must be unique
// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   price: 497,
//   rating: 4.7,
// });

//we don't need a new variable for each document in the database. we can just change the object values for this variable and repeat the save method on it each time we are tryign to populate a new document. Since the name is unique and all the other data validation in the schema are present, it will save this to the database the first time this is saved
const testTour = new Tour({
  name: 'The Park Camper',
  price: 997,
});

//this method saves the testTour instance of the Tour model to the database
testTour
  .save()
  .then((doc) => {
    console.log(doc);
  })
  .catch((e) => {
    console.log(e);
  });

const app = require('./app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

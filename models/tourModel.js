const mongoose = require('mongoose');

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

module.exports = Tour;

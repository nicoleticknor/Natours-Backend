const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: Number,
    summary: {
      type: String,
      //this is the same as excel trim, but applies only to strings
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    //this is the same as type: [String] which is an array of strings
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      //this will permanently hide this field from the query results
      select: false,
    },
    //an array of start dates
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    //the second argument in the Schema method is the options object
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//virtual properties are ones that are calculated fields rather than ones persisted in the DB. Doing this here keeps business logic separate from application logic
//note that we can't query anything that's not in the DB
//use the get method because this virtual property will be created each time we use the "get" method from the database
//getter can't have an arrow function because we need the this keyword
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// ?? DOCUMENT MIDDLEWARE

//pre is a middleware that will run before an event. in this case the event is the save method, and therefore also the create() method. However it won't trigger from insertMany()
//we will have access to the data to be saved via the this keyword, so we can act on it that way
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//for demonstration that we can have more than one pre method for a single method (save)
// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

//the post middleware funcs have access to the document that was just saved. called doc here
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// ?? QUERY MIDDLEWARE

//this will point at the current query, rather than the current document
//note that find is different from findOne, which is working behind the scenes of mongoose's findById method, etc, so we need regex instead of just 'find' (or we could specify two middlewares but that's not DRY)
tourSchema.pre(/^find/, function (next) {
  //use case here will be for "secret tours" that only appear to select groups of users
  //doing it this way because if we set it to false, the ones we created before we created this attribute won't show up
  //nb that mongoose is adding the default "false" to those that didn't have it, but in the DB itself, that attribute is blank
  this.find({ secretTour: { $ne: true } });

  //we can use this middleware to create new attributes on the object
  this.start = Date.now();
  next();
});

//for demonstration purposes: those new attributes persist so we can use them in the post middleware
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

// ?? AGGREGATION MIDDLEWARE

//this will point at the current aggregation object
tourSchema.pre('aggregate', function (next) {
  //adding a state to the pipeline. we could have done this in the aggregate pipelines themselves, but that's not DRY. this way it applies to every aggregation process, which is what we want for this use case
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log(this.pipeline()); //you can see the pipeline that you created in the controller
  next();
});

//this is the "model" that we create out of the Schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

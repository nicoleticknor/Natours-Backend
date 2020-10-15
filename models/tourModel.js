const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must be 40 characters or less'],
      minlength: [10, 'A tour name must have at least 10 characters'],
      //this is how to use the custom validator library
      //demonstration only because this excludes spaces
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
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
      //enum is only available on strings
      enum: {
        //note that these are case-sensitive
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      //min/max will work on numbers and dates
      min: [1, 'Rating must be at least 1'],
      max: [5, "Rating can't be greater than 5"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //this is a custom validator
      validate: {
        //the callback has access to the value associated with priceDiscount for each instance.
        //you don't need to specify validator if you don't also have a message. it can just be validate: function(val) etc
        //you could also do this as an array, but that would look weird so we did it as an object
        validator: function (val) {
          //you can only use the this keyword in a validator when creating a new document. this will not be available when updating a document
          return val < this.price; // if priceDiscount is 100 and price is 350, then this is true. If priceDiscount were 400, this would return false
        },
        //this {VALUE} thing is a mongoose thing; it has access to the value just like the callback but it's syntax is specific
        message: 'Discount price ({VALUE}) must be lower than regular price',
      },
    },
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
    startLocation: {
      // Mongo uses a special data type called GeoJSON for geospatial data
      //this is actually an embedded object, not an options object. The options are nested in each key
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // this is how we embed/denormalize data with Mongo. This array of objects will create new documents for each instance
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        // the day of the tour that people will go to this location
        day: Number,
      },
    ],
    // guides: Array,
    // this is how to reference another schema
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    //the second argument in the Schema method is the options object
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// * indexing tour documents by price ascending and ratingsAverage descending
// * note that once you create an index, you have to delete it via Compass (can't just remove the line of code)
// these will be a popular filter options, so indexing in advance improves performance
// this is because it has to search only the first n documents to determine which docs to return, instead of having to search them all
// study access patterns to determine which fields to index. Storage memory increases with indexes, so don't do these for models that have high write to read ratios
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// * virtual fields and virtual populate
//virtual fields are ones that are calculated rather than persisted in the DB. note that we can't query them
//use the get method because this virtual property will be created each time we use the "get" method from the database
//getter can't have an arrow function because we need the this keyword
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate (instead of child referencing)
tourSchema.virtual('reviews', {
  ref: 'Review',
  // in the Review model, the foreign key to tours is called "tours"
  foreignField: 'tour',
  // in the tour model, the primary key is "_id"
  localField: '_id',
});

// ?? DOCUMENT MIDDLEWARE

//pre is a middleware that will run before an event. in this case the event is the save method, and therefore also the create() method. However it won't trigger from insertMany(), or for the update() method
//we will have access to the data to be saved via the this keyword, so we can act on it that way
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//we can have more than one pre method for a single method (save)
// * if we were embedding the guides, this is how we would do it (with an array as the guides type in the model)
// * since we aren't, we only have to use a child reference in the model itself (above)
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// * the post middleware funcs have access to the document that was just saved. called doc here
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

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
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

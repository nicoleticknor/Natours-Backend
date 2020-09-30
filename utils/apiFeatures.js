// ?? BUILD QUERY

class APIFeatures {
  constructor(query, queryString) {
    //this is Tour.find(), which will return the entire collection data (no query params applied)
    this.query = query;
    //this is the req.query
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //since we are using the find method with queryObj, and queryObj may come in with sort, limit, etc, we need to strip those out. Because none of our documents in this collection has those fields, obviously
    excludedFields.forEach((f) => delete queryObj[f]);

    // ** ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);

    //use regex to grab the query params and add the $ in front of the operator as in mongoDB query language
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // use the find method on this.query
    this.query = this.query.find(JSON.parse(queryStr));

    //have to return the object instance from this method so that we can chain other methods after it
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // console.log(req.query.sort); // -price,-ratingsAverage (for example)
      // this split/join is to translate the query string comma "," between the fields into a mongoose-friendly space " " (see mongoose docs on sort method for syntax)
      const sortBy = this.queryString.sort.split(',').join(' ');
      //the sort method of the query object is a mongoose "query builder" thing
      this.query = this.query.sort(sortBy);
    } else {
      //creating a default sort parameter in case the user does not specify
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      //again, the select method expects a space instead of a comma
      const fields = this.queryString.fields.split(',').join(' ');
      //so we only get the fields the user selects
      this.query = this.query.select(fields);
    } else {
      //default - we want all fields, but only all useful fields. since mongoose automatically includes a __v field for each document, and we don't want to disable that strictly, we will exclude them in the else/default case
      //the minus operator will exlude the field; this will select everything except the __v fields
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;

const fs = require("fs");
const express = require("express");

const app = express();

//middleware so that we can add data from the request body to the request object
app.use(express.json());

// app.get("/", (req, res) => {
//   res.status(200).send("Hello from the server side");
// });

//since the data is local, reading this into a variable first so that it's not blocking when the route handler api/v1/tours is called
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`),
);

// specifying v1 so that the API can be changed and not break for users who still use v1
app.get("/api/v1/tours", (req, res) => {
  res.status(200).json({
    status: "success",
    //do this when sending an array / multiple objects
    results: tours.length,
    data: { tours }, //tours: tours (ES6)
  });
});

app.post("/api/v1/tours", (req, res) => {
  // console.log(req.body);

  const newId = tours[tours.length - 1].id + 1;
  // doing it this way so we don't mutate the original body object
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  //don't use writeFileSync so that we don't block the event loop
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: "success",
        data: { tour: newTour },
      });
    },
  );
  // you'll get an error "Cannot send headers after they are sent to the client" if you try to send two responses
  // res.send("success");
});

const port = 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

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

app.get("/api/v1/tours/:id", (req, res) => {
  //note that /:x/:y?/:z will give back x y and z as params too, where y is optional (? modifier)

  // console.log(req.params);

  const id = Number(req.params.id);
  // one potential quick and easy guard clause
  // if (id > tours.length) {
  //   return res.status(404).json({
  //     status: "failed",
  //     message: "invalid id",
  //   });
  // }

  const tour = tours.find((e) => e.id === id);
  //another temp guard clause
  if (!tour) {
    return res.status(404).json({
      status: "failed",
      message: "invalid id",
    });
  }

  res.status(200).json({
    status: "success",
    data: { tour },
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

app.patch("/api/v1/tours/:id", (req, res) => {
  //not actually going to implement this right now b/c that's a lot of fs methods; will do this later with the actual DB

  const id = req.params.id;

  if (id > tours.length) {
    return res.status(404).json({
      status: "failed",
      message: "invalid id",
    });
  }
  res.status(200).json({
    status: "success",
    data: {
      tour: "<updated tour here...>",
    },
  });
});

app.delete("/api/v1/tours/:id", (req, res) => {
  //won't actually do this right now; we will wait til the DB is up
  const id = req.params.id;

  if (id > tours.length) {
    return res.status(404).json({
      status: "failed",
      message: "invalid id",
    });
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

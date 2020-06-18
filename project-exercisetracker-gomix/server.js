'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('./models/userModel');
const Exercise = require('./models/exerciseModel');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

dotenv.config({ path: './.env' });

var port = process.env.PORT || 3000;

let DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Not found middleware
// app.use((req, res, next) => {
//   return next({ status: 404, message: 'not found' });
// });

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || 'Internal Server Error';
  }
  res.status(errCode).type('txt').send(errMessage);
});

app.post('/api/exercise/new-user', async function (req, res) {
  const newUser = req.body;

  const originalUser = await User.create(newUser);

  res.status(201).json({
    username: originalUser.username,
    _id: originalUser.id,
  });
});

app.get('/api/exercise/users', async function (req, res) {
  const users = await User.find();
  res.status(200).send(users);
});

app.post('/api/exercise/add', async function (req, res) {
  const newExercise = req.body;

  if (!newExercise.date) {
    newExercise.date = Date.now()
  }
  //create new exercise
  const originalExercise = await Exercise.create(newExercise);
  //insert new exercise in the user
  await User.updateOne(
    {
      _id: newExercise.userId,
    },
    {
      $push: {
        exercise: originalExercise._id,
      },
    }
  );

  res.status(200).json({
    originalExercise,
  });
});

app.listen(port || 3000, () => {
  console.log(`Your app is listening on port: ${port}`);
});

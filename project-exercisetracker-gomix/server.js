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

app.get('/api/exercise/log?:userId?:from?:to?:limit', async function (
  req,
  res
) {
  const userId = req.query.userId;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  let user = await User.findById(userId);
  if (!user) {
    return 'user not found';
  }
  let exercise = user.exercise.map((el) => {
    return (el = {
      description: el.description,
      duration: el.duration,
      date: el.date,
    });
  });

  if (from) {
    let parts = from.split('-');
    let newDate = new Date(parts[0], parts[1] - 1, parts[2]);
    exercise = exercise.filter((el) => {
      return el.date > newDate;
    });
  }

  if (to) {
    let parts = to.split('-');
    let newDate = new Date(parts[0], parts[1] - 1, parts[2]);
    exercise = exercise.filter((el) => {
      return el.date < newDate;
    });
  }

  if (limit) {
    exercise = exercise.slice(0, limit);
  }

  res.status(200).json({
    userId: user._id,
    username: user.username,
    count: exercise.length,
    log: exercise,
  });
});

app.post('/api/exercise/add', async function (req, res) {
  const newExercise = req.body;

  if (!newExercise.date) {
    newExercise.date = new Date();
  } else {
    newExercise.date = new Date(newExercise.date);
  }
  //create new exercise

  const originalExercise = await Exercise.create(newExercise);
  const user = await User.findById(newExercise.userId);

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
    _id: user._id,
    description: originalExercise.description,
    duration: originalExercise.duration,
    date: originalExercise.date.toDateString(),
    username: user.username
  });
});

app.listen(port || 3000, () => {
  console.log(`Your app is listening on port: ${port}`);
});

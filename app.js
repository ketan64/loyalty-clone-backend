const express = require('express');
const config = require('./src/config/config');
const routes = require('./src/routes/');
const app = express();
require('./src/config/passport.js'); // Initialize Passport

// parse json request body
app.use(express.json());

app.use('/api', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
  });
module.exports = app;

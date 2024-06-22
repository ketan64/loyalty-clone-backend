const express = require('express');
// const passport = require('passport');
const config = require('./src/config/config');
// const { jwtStrategyForUser } = require('./src/config/passport');
const routes = require('./src/routes/');
const app = express();
// parse json request body
app.use(express.json());

app.use('/api', routes);
module.exports = app;

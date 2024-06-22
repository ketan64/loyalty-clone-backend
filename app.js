const express = require('express');
const config = require('./src/config/config');
const routes = require('./src/routes/');
const app = express();
// parse json request body
app.use(express.json());

app.use('/api', routes);
module.exports = app;

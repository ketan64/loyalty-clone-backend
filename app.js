/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
// const helmet = require('helmet');
// const xss = require('xss-clean');
// const mongoSanitize = require('express-mongo-sanitize');
// const compression = require('compression');
// const cors = require('cors');
// const passport = require('passport');
// const httpStatus = require('http-status');
const config = require('./src/config/config');
// const morgan = require('./config/morgan');
// const { jwtStrategyForUser } = require('./config/passport');
// const { authLimiter } = require('./middlewares/rateLimiter');
// const routes = require('./routes/v1');
// const { errorConverter, errorHandler } = require('./middlewares/error');
// const ApiError = require('./utils/ApiError');

const app = express();

// if (config.env !== 'test') {
//   app.use(morgan.successHandler);
//   app.use(morgan.errorHandler);
// }

// set security HTTP headers
// app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
// app.use(express.urlencoded({ extended: true }));

// sanitize request data
// app.use(xss());
// app.use(mongoSanitize());

// gzip compression
// app.use(compression());

// enable cors
// app.use(cors());
// app.options('*', cors());

// jwt and githubauthentication
// app.use(passport.initialize());
// passport.use('jwtuser', jwtStrategyForUser);
// passport.serializeUser((user, done) => {
//   done(null, user);
// });
// passport.deserializeUser((obj, done) => {
//   done(null, obj);
// });

// limit repeated failed requests to auth endpoints
// if (config.env === 'production') {
//   app.use('/auth', authLimiter);
// }

// v2 api routes
// app.use('/v1', routes);

// send back a 404 error for any unknown api request
// app.use((req, res, next) => {
//   next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
// });

// convert error to ApiError, if needed
// app.use(errorConverter);

// handle error
// app.use(errorHandler);

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(config.port, () => {
    console.log(`Example app listening at http://localhost:${config.port}`);
});

module.exports = app;

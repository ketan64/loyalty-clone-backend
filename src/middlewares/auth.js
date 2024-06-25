const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const verifyUserCallback = (req, resolve, reject, role) => async (err, user, info) => {
  if (err || info || !user || user.isDeleted) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;
  if (!role.includes(user.role) && user.role !== 'SUPER ADMIN') {
    return reject(new ApiError(httpStatus.FORBIDDEN, `${user.role} are not allowed to perform this action.`));
  }
  resolve();
};

const userAuth = (role) => async (req, res, next) => new Promise((resolve, reject) => {
  passport.authenticate('jwtuser', { session: false }, verifyUserCallback(req, resolve, reject, role))(
    req,
    res,
    next,
  );
})
  .then(() => next())
  .catch((err) => next(err));

module.exports = {
  userAuth,
};

const express = require('express');
const partnerRoute = require('./partner.route');
const authRoute = require('./authRoutes');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/partner',
    route: partnerRoute,
  },
  {
    path: '/auth',
    route : authRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;

const express = require('express');
const partnerRoute = require('./partner.route')

const router = express.Router();

const defaultRoutes = [
  {
    path: '/partner',
    route: partnerRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;

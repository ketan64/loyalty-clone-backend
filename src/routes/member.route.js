const express = require('express');
const validate = require('../middlewares/validate.js');
const { userAuth } = require('../middlewares/auth.js');
const { memberController } = require('../controllers/index.js');


const router = express.Router({ mergeParams: true });

router
  .route('/getBalance')
  .get(userAuth(['USER','ADMIN']), memberController.getBalance); //validate(partnerValidation.getPartnerList),
  
module.exports = router;
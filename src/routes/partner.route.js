const express = require('express');
const validate = require('../middlewares/validate.js');
// const { userAuth } = require('../middlewares/auth.js');
const { partnerController } = require('../controllers/index.js');
const { partnerValidation } = require('../validations/index.js');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(validate(partnerValidation.createPartner),partnerController.createPartner)
  .get(validate(partnerValidation.getPartnerList), partnerController.getPartnerList)
  
 router
  .route('/:id')
  .put(validate(partnerValidation.updatePartner), partnerController.updatePartner)


module.exports = router;

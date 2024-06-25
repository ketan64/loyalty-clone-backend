const express = require('express');
const validate = require('../middlewares/validate.js');
const { userAuth } = require('../middlewares/auth.js');
const { partnerController } = require('../controllers/index.js');
const { partnerValidation } = require('../validations/index.js');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(userAuth(['ADMIN']),validate(partnerValidation.createPartner),partnerController.createPartner)
  .get(userAuth(['USER']),validate(partnerValidation.getPartnerList), partnerController.getPartnerList)
  
 router
  .route('/:id')
  .put(userAuth(['ADMIN']),validate(partnerValidation.updatePartner), partnerController.updatePartner)

module.exports = router;

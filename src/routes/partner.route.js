const express = require('express');
const validate = require('../middlewares/validate.js');
const { userAuth } = require('../middlewares/auth.js');
const { partnerController } = require('../controllers/index.js');
const { partnerValidation } = require('../validations/index.js');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(userAuth(['ADMIN']),validate(partnerValidation.createPartner),partnerController.createPartner)
  .get(userAuth(['USER','ADMIN']),validate(partnerValidation.getPartnerList), partnerController.getPartnerList)
  
 router
  .route('/:id')
  .put(userAuth(['ADMIN']),validate(partnerValidation.updatePartner), partnerController.updatePartner)
  .get(userAuth(['ADMIN', 'USER']),validate(partnerValidation.getPartner), partnerController.getPartner)

router
  .route('/:id/user-activity/earn-points')
  .post(userAuth(['ADMIN', 'USER']),validate(partnerValidation.earnTransaction),partnerController.earnTransaction)
  
module.exports = router;

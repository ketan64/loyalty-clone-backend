const Joi = require('joi');
const { values } = require('lodash');

const createPartner = {
  body: Joi.object({
    partnerName: Joi.string().required(),
    pocDetails: Joi.array().items(
      Joi.object({
        pocType: Joi.string().required(),
        isSameAsPrimary: Joi.boolean().required(),
        name: Joi.string().optional(),
        mobileNumber: Joi.string().optional(),
        email: Joi.string().optional().email(),
      })
    ),
    isActive: Joi.boolean().optional(),
    mopsExcludedFromEarnAmount: Joi.array().items(Joi.string()),
    earnUnlockPeriod: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().required(),
      deleted: Joi.boolean().optional(),
    }).required(),
  }),
};

const updatePartner = {
  body: Joi.object({
    partnerName: Joi.string().required(),
    pocDetails: Joi.array().items(
      Joi.object({
        pocType: Joi.string().required(),
        isSameAsPrimary: Joi.boolean().required(),
        name: Joi.string().optional(),
        mobileNumber: Joi.string().optional(),
        email: Joi.string().optional().email(),
      })
    ),
    isActive: Joi.boolean().optional(),
    mopsExcludedFromEarnAmount: Joi.array().items(Joi.string()),
    earnUnlockPeriod: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().required(),
      deleted: Joi.boolean().optional(),
    }).required(),
  }),
};

const getPartner = {
  query: Joi.object().keys({
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    from: Joi.date(),
    sortBy: Joi.string(),
    to: Joi.date(),
    partnerName: Joi.string(),
  }),
};

const earnTransaction = {
  body: Joi.object({
    mobileNumber : Joi.string().required(),
    earnAmount: Joi.number().integer().required(),
    activityTs: Joi.string().required(),
    activityCode: Joi.string().required(),
    actualPurchaseAmount: Joi.number().integer().required(),
    partnerTransactionId: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
      itemId: Joi.string().required(),
      units: Joi.number().integer().required(),
      category: Joi.string().required(),
      amount: Joi.number().integer().required(),
      additionalFields: Joi.array().items({
        fieldName: Joi.string(),
        fieldValue: Joi.string()
      }).optional(),
    })),
    modeOfPayments: Joi.array().items(
      Joi.object({
        code: Joi.string().required(),
        name: Joi.string().optional(),
        amount: Joi.number().integer().required()
      })
    ).optional()
  })
}

module.exports = {
  updatePartner,
  getPartner,
  createPartner,
  earnTransaction
};

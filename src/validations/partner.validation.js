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

module.exports = {
  updatePartner,
  getPartner,
  createPartner,
};

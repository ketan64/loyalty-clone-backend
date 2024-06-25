const partner = require('../models/partner.model');

const getPartner = async (filter) => partner.findOne(filter);

const addPartner = async (data) => partner.create(data);

const getPartnerList = async (filter = {}, options) => partner.find();

const updatePartner = async (filter, body) => partner.findOneAndUpdate(filter, body, { new: true });


module.exports = {
  getPartner,
  addPartner,
  getPartnerList,
  updatePartner,
};

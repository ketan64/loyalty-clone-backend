const member = require('../models/member.model');

const getMember = async (filter) => member.findOne(filter);

const addMember = async (data) => member.create(data);

// const getPartnerList = async (filter = {}, options) => partner.find();

const updateMember = async (filter, body) => member.findOneAndUpdate(filter, body, { new: true });


module.exports = {
  getMember,
  addMember,
//   getPartnerList,
  updateMember,
};

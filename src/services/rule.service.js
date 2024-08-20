const rule = require('../models/rule.model');


const addBaseRule = async(data) => rule.create(data);
const getRule = async(filter) => rule.find(filter);

module.exports = {
  addBaseRule,
  getRule
};

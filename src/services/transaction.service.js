const { filter } = require('lodash');
const transaction = require('../models/transaction.model');

const addTransaction = async (data) => transaction.create(data);
const getTransaction = async(filter) => transaction.findOne(filter);

module.exports = {
  addTransaction,
  getTransaction
};

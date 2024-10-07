const { filter } = require('lodash');
const transaction = require('../models/transaction.model');

const addTransaction = async (data) => transaction.create(data);
const getTransaction = async(filter) => transaction.findOne(filter);
const updateTransaction = async(filter, data) => transaction.findOneAndUpdate(filter, data, {new: true});

module.exports = {
  addTransaction,
  getTransaction,
  updateTransaction
};

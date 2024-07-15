const { required } = require('joi');
const mongoose = require('mongoose');
const { v4 } = require('uuid');

const additionalFields = new mongoose.Schema(
  {
    fieldName: String,
    fieldValue: String
  }
)
const items = new mongoose.Schema(
  {
    itemId: String,
    units: Number,
    category: String,
    amount: Number,
    additionalFields : [
      additionalFields,
    ] 
  }
) 

const modeOfPayments = new mongoose.Schema(
  {
    code : String,
    name : String,
    amount: Number
  }
)
const transactionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default() {
        return `txn_${v4()}`;
      },
    },
    mobileNumber: {
      type: String,
      required: true
    },
    transactionType: {
      type: String,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    },
    earnAmount: {
      type: Number,
      required: true
    },
    activityTs: {
      type: Date,
      default: Date.now,
      required: true
    },
    activityCode: {
      type: String,
      required: true
    },
    actualPurchaseAmount: {
      type: Number
    },
    partnerTransactionId : {
      type: String,
      required: true,
      unique: true
    },
    items: [
      items
    ],
    modeOfPayments: [
      modeOfPayments
    ]
  },
  {
    timestamps: true
  }
);

// transactionSchema.index({ partnerTransactionId: 1, transactionType: 1, mobileNumber: 1 }, { unique: true });


const Transaction = mongoose.model('transaction', transactionSchema);

module.exports = Transaction;

const { required, boolean } = require('joi');
const mongoose = require('mongoose');
const { v4 } = require('uuid');

const userFilters = new mongoose.Schema(
    {
      operator: String,
      value: String,    
      field: String
    }
)

const activityFilters = new mongoose.Schema(
    {
      operator: String,
      value: String,    
      field: String
    }
)

const itemFilters = new mongoose.Schema(
    {
      operator: String,
      value: String,    
      field: String
    }
)

const validity = new mongoose.Schema({
    from: String,
    to: String
})

const amountOfPoints = new mongoose.Schema({
    allocationType: {
        type: String,
        enum: ["flat", "percent"]
    },
    points: Number,
    percentageOfAmount: Number
})

const expiration = new mongoose.Schema({
    value: Number,
    unit: {
        type: String,
        enum: ["minutes", "hours", "days", "months"]
    }
})

const ruleSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default() {
        return `rule_${v4()}`;
      },
    },
    ruleCode : {
        type: String,
        required: true
    },
    ruleDisplayText: {
        type: String,
    },
    activityCode: {
        type: String,
        required: true
    },
    validity: validity,
    amountOfPoints: amountOfPoints,
    expiration: [expiration],
    isRewardPerUnit: {
        type: Boolean
    },
    partnerId: {
        type: String,
        required: true
    },
    isActive: {
        type: String
    },
    ruleType: {
        type: String
    },
    itemFilters: [itemFilters],
    activityFilters: [activityFilters],
    userFilters: [userFilters],
  }, 
  {
    timestamps: true,
  },
);
const rule = mongoose.model('rule', ruleSchema);

module.exports = rule;

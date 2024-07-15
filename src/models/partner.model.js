const mongoose = require('mongoose');
const { v4 } = require('uuid');

const pocDetails = new mongoose.Schema(
    {
      pocType: String,
      isSameAsPrimary: {
          type: Boolean,
          default: true
      },
      name: String,
      mobileNumber: String,
      email: String,
    }
)

const earnUnlockPeriod = new mongoose.Schema(
{
  value: String,
  unit: String,
  deleted: {
      type: Boolean,
      default: false
  },
}
) 

const partnerSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default() {
        return `cus_${v4()}`;
      },
    },
    partnerName: {
      type: String,
      required: true,
      unique: true,
      index : true
    },
    isActive:{
        type: Boolean,
        default: true
    },
    pocDetails:[
        pocDetails
    ],
    earnUnlockPeriod: [
        earnUnlockPeriod
    ],
    mopsExcludedFromEarnAmount: [
        String
    ],
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
  },
  {
    timestamps: true,
  },
);
const partner = mongoose.model('partner', partnerSchema);

module.exports = partner;

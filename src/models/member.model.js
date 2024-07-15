const { required, number, boolean } = require('joi');
const mongoose = require('mongoose');
const { type } = require('os');
const { v4 } = require('uuid');

const memberSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            default() {
                'member_${v4()}'
            }
        },
        firstName: {
            type: String,
            // required: true
        },
        lastName: {
            // type: String
        },
        email: {
            type: String,
            // required: true
        },
        mobileNumber: {
            type: String,
            required: true,
            unique: true,
        },
        balance: {
            type: Number,
            default: 0
        },
        status: {
            type: Boolean,
        },
        transactions: [
            {
              type: String,
              ref: 'Transaction',
            },
        ],
    },
    {
        timestamps: true
    }
)

const member = new mongoose.model('member', memberSchema);

module.exports = member;




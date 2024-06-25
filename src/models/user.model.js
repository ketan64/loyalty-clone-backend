const mongoose = require('mongoose');
const { v4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default() {
        return `user_${v4()}`;
      },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String },
    isDeleted: { type: Boolean, default: false },
    role: { 
      type: String ,
      required: true,
      enum: ['ADMIN', 'SUPER ADMIN', 'USER']
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model('users', userSchema);

module.exports = User;

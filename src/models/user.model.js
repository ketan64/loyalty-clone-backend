const mongoose = require('mongoose');
const { v4 } = require('uuid');
// const { toJSON, paginate } = require('./plugins');

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
  },
  {
    timestamps: true,
  },
);

// userSchema.plugin(toJSON);
// userSchema.plugin(paginate);

const User = mongoose.model('users', userSchema);

module.exports = User;

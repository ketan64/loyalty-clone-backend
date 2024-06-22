const User = require('../models/user.model');

const getUserByEmail = async (email) => {
    return await User.findOne({ email, isDeleted: false });
  };

module.exports = {
getUserByEmail,
};
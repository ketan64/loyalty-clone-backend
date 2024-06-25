/*
This script add a user
Useage: node createUser.js email@domain.com password
*/

const mongoose = require('mongoose');
const config = require('../config/config');
const { logger } = require('../config/logger');

const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4];

if (!email) {
  logger.error('Email and password required');
  process.exit(0);
}

mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
  logger.info('Connected to MongoDB');
  const User = require('../models/user.model');
  await User.create({
    email,
    password,
    role
  });
  logger.info('User Created Successfully...');
  process.exit(0);
});

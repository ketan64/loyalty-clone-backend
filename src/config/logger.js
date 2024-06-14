const winston = require('winston');
const config = require('./config');
require('winston-daily-rotate-file');

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.timestamp(),
    winston.format.printf((info) => `[${[info.timestamp]}] ${info.level}: ${info.message}`),
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    new winston.transports.File({
      filename: `${config.logs_dir}/user.log`,
      maxsize: 50000000, // 50MB
    }),
  ],
});

const accessLogger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.timestamp(),
    winston.format.printf((info) => `${[info.timestamp]} | ${info.message} `),
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: `${config.logs_dir}/access/access-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
    }),
  ],
});

const scheduleLogger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.timestamp(),
    winston.format.printf((info) => `${[info.timestamp]} | ${info.message} `),
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: `${config.logs_dir}/access/schedule-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
    }),
  ],
});

module.exports = {
  accessLogger,
  logger,
  scheduleLogger
};

const log4js = require('log4js');

log4js.configure({
    appenders: {
        email: {
            type: '@log4js-node/smtp',
            subject: 'logs for acf-booking',
            sender: process.env.SMTP_USER,
            recipients: 'webmaster@arc-club-fribourg.ch',
            SMTP: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            },
        },
        file: {
            type: 'file',
            filename: 'log.log',
        },
    },
    categories: {
        default: {
            appenders: [
                'email',
                'file',
            ],
            level: 'error',
        },
    },
});

const logger = log4js.getLogger();
logger.level = 'debug';

module.exports = logger;

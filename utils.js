const Nodemailer = require('nodemailer');
const { User } = require('@models');

const utils = {
    getYMD(date) {
        const year = date.getFullYear();
        const month = `0${date.getMonth() + 1}`.slice(-2);
        const day = `0${date.getDate()}`.slice(-2);
        return `${year}-${month}-${day}`;
    },

    getHM(date) {
        const hour = `0${date.getHours()}`.slice(-2);
        const minute = `0${date.getMinutes()}`.slice(-2);
        return `${hour}h${minute}`;
    },

    getDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const remaining = minutes - 60 * hours;
        return `${hours}h${remaining ? `${remaining}` : ''}`;
    },

    validate: {
        email: (v) => typeof v === 'string' && /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v) === true,
        password: (v) => typeof v === 'string' && v.length >= 8,
        string: (v) => typeof v === 'string' && v.length > 0,
    },

    async getUser(ctx) {
        ctx.body = await User.findById(
            ctx.user.id,
            'username email role',
        );
    },

    async sendEmail(to, subject, html, text) {
        const transporter = Nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        await transporter.sendMail({
            from: 'webmaster@arc-club-fribourg.ch',
            to,
            subject,
            html,
            text,
        });
    },
};

module.exports = utils;

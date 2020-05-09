const JsonWebToken = require('jsonwebtoken');
const Bcrypt = require('bcrypt');
const Router = require('koa-router');
const Nodemailer = require('nodemailer');

const { User } = require('@models');

const router = new Router({
    prefix: '/auth',
});

router

    .post('/register', async (ctx) => {
        try {
            const { body } = ctx.request;
            if (!body.password) {
                ctx.status = 400;
                return;
            }

            const duplicate = await User.findOne({ email: body.email });
            if (duplicate) {
                ctx.status = 409;
                return;
            }

            const password = await Bcrypt.hash(body.password, 10);
            const registrationToken = Math.random().toString(36).substring(2, 15)
                + Math.random().toString(36).substring(2, 15);

            const user = new User({
                email: body.email,
                username: body.username,
                role: 'user',
                registrationToken,
                password,
            });
            await user.save();
            delete user.password;
            ctx.body = user;

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
                to: user.email,
                subject: 'Votre compte ACF-réservations',
                text: `Bienvenue sur le système de réservation de l'arc club! Afin de valider votre compte merci de cliquer sur le lien suivant: ${process.env.FRONTEND_URL}/validate?token=${user.registrationToken}`,
                html: `Bienvenue sur le système de réservation de l'arc club! <br>Afin de valider votre compte merci de cliquer sur le lien suivant: <a href="${process.env.FRONTEND_URL}/validate?token=${user.registrationToken}">confirmer mon compte</a>.`,
            });

            ctx.status = 201;
        } catch (err) {
            ctx.status = 400;
        }
    })

    .post('/login', async (ctx) => {
        const { body } = ctx.request;

        ctx.assert(body.password, 400);

        const user = await User.findOne({
            email: ctx.request.body.email,
            registrationToken: { $exists: false },
        });
        ctx.assert(user !== null, 404);

        const match = await Bcrypt.compare(ctx.request.body.password, user.password);
        ctx.assert(match, 400);

        return new Promise((resolve, reject) => {
            JsonWebToken.sign({
                userId: user._id,
                role: user.role,
                exp: Math.floor(Date.now() / 1000) + (60 * 60),
            }, process.env.JWT_SECRET, (err, token) => {
                if (err) {
                    ctx.status = 400;
                    reject();
                } else {
                    ctx.body = {
                        token,
                    };
                    ctx.status = 200;
                    resolve();
                }
            });
        });
    })

    .get('/validate', async (ctx) => {
        ctx.assert(ctx.query.token, 400);

        const user = await User.findOneAndUpdate(
            { registrationToken: ctx.query.token },
            { $unset: { registrationToken: '' } },
        );
        ctx.status = user !== null ? 204 : 400;
    });


module.exports = router;

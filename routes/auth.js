const JsonWebToken = require('jsonwebtoken');
const Bcrypt = require('bcrypt');
const Router = require('koa-router');

const logger = require('@logger');
const { getUser, sendEmail, validate } = require('@utils');
const { User } = require('@models');

const router = new Router({
    prefix: '/auth',
});

router

    .post('/register', async (ctx) => {
        const { body } = ctx.request;
        ctx.assert(validate.password(body.password), 400);

        ctx.assert(validate.string(body.username), 400);

        ctx.assert(validate.email(body.email), 400);

        const duplicate = await User.findOne({ email: body.email });
        ctx.assert(duplicate === null, 409);

        try {
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
            ctx.user = user;

            await sendEmail(
                user.email,
                'Votre compte ACF-réservations',
                `Bienvenue sur le système de réservation de l'arc club! <br>Afin de valider votre compte merci de cliquer sur le lien suivant: <a href="${process.env.FRONTEND_URL}/#/validate?token=${user.registrationToken}">confirmer mon compte</a>.`,
                `Bienvenue sur le système de réservation de l'arc club! Afin de valider votre compte merci de cliquer sur le lien suivant: ${process.env.FRONTEND_URL}/#/validate?token=${user.registrationToken}`,
            );
            ctx.status = 204;
        } catch (err) {
            ctx.status = 500;
            logger.error({ err, ctx });
        }
    })

    .post('/login', async (ctx) => {
        const { body } = ctx.request;

        ctx.assert(body.password, 400);

        const user = await User.findOneAndUpdate(
            {
                email: ctx.request.body.email,
                registrationToken: { $exists: false },
            },
            {
                $unset: { passwordToken: true },
            },
        );
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

    .post('/validate', async (ctx) => {
        ctx.assert(validate.string(ctx.query.token), 400);
        ctx.user = await User.findOneAndUpdate(
            { registrationToken: ctx.query.token },
            { $unset: { registrationToken: '' } },
        );
        ctx.assert(ctx.user !== null, 400);
        return getUser(ctx);
    })

    .post('/password/set', async (ctx) => {
        const { body } = ctx.request;
        ctx.assert(validate.password(body.password), 400);
        ctx.assert(validate.string(ctx.query.token), 400);
        const password = await Bcrypt.hash(body.password, 10);
        ctx.user = await User.findOneAndUpdate(
            { passwordToken: ctx.query.token },
            {
                $unset: { passwordToken: true },
                $set: { password },
            },
        );
        ctx.assert(ctx.user !== null, 400);
        return getUser(ctx);
    })

    .post('/password/reset', async (ctx) => {
        const { email } = ctx.request.body;
        ctx.assert(email !== undefined, 400);
        const user = await User.findOne({ email });
        ctx.assert(user !== null, 404);

        try {
            const passwordToken = Math.random().toString(36).substring(2, 15)
                + Math.random().toString(36).substring(2, 15);
            user.passwordToken = passwordToken;
            await user.save();

            await sendEmail(
                user.email,
                'ACF-réservations: mot de passe oublié',
                `Veuillez cliquer sur le lien suivant afin de définir un nouveau mot de passe: <a href="${process.env.FRONTEND_URL}/#/reset?token=${user.passwordToken}">définir un nouveau mot de passe</a>.`,
                `Veuillez cliquer sur le lien suivant afin de définir un nouveau mot de passe: ${process.env.FRONTEND_URL}/#/reset?token=${user.passwordToken}`,
            );
            ctx.status = 204;
        } catch (err) {
            ctx.status = 500;
            logger.error({ err, ctx });
        }
    });

module.exports = router;

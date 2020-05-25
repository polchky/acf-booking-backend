const Router = require('koa-router');
const Bcrypt = require('bcrypt');

const { getUser, validate } = require('@utils');
const { User } = require('@models');
const { auth, param } = require('@middlewares');

const router = new Router({
    prefix: '/users',
});

router
    .use(auth.jwt)
    .param('userId', param(User))

    .get('/', auth.hasRole('admin'), async (ctx) => {
        const users = await User.find();
        ctx.body = users.map((user) => {
            delete user.password; return user;
        });
    })

    .get('/:userId', auth.hasUserId(), async (ctx) => {
        await getUser(ctx);
    })

    .put('/:userId', auth.or([auth.hasRole('admin'), auth.hasUserId()]), async (ctx) => {
        const { body } = ctx.request;
        const set = {};

        // Change role
        if (ctx.state.user.role === 'admin' && validate.string(body.role)) {
            set.role = body.role;
        }

        // Change username
        if (validate.string(body.username)) {
            set.username = body.username;
        }

        // Change password
        if (validate.password(body.password) && validate.password(body.newPassword)) {
            // Check password validity
            const match = Bcrypt.compare(body.password, ctx.user.password);
            ctx.assert(match, 400);
            set.password = await Bcrypt.hash(body.newPassword, 10);
        }

        const user = await User.findByIdAndUpdate(
            ctx.user.id,
            set,
            {
                new: true,
                select: 'username email',
            },
        );
        ctx.assert(user !== null, 400);
        ctx.body = user;
    })

    .delete('/:userId', auth.or([auth.hasUserId(), auth.hasRole('admin')]), async (ctx) => {
        await User.deleteOne({ _id: ctx.user.id });
        ctx.status = 204;
    });

module.exports = router;

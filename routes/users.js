const Router = require('koa-router');
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

    .get('/:userId', auth.hasUserId(), (ctx) => {
        delete ctx.user.password;
        ctx.body = ctx.user;
    })

    .delete('/:userId', auth.or([auth.hasUserId(), auth.hasRole('admin')]), async (ctx) => {
        await User.deleteOne({ _id: ctx.user.id });
        ctx.status = 204;
    });

module.exports = router;

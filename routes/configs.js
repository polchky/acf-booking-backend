const Router = require('koa-router');
const { Config } = require('@models');
const { auth } = require('@middlewares');

const router = new Router({
    prefix: '/config',
});

router
    .use(auth.jwt)

    .get('/', async (ctx) => {
        ctx.body = await Config.findOne({});
    })

    .put('/', auth.hasRole('admin'), async (ctx) => {
        try {
            ctx.body = await Config.findOneAndUpdate(
                {},
                ctx.request.body,
                { new: true },
            );
        } catch (err) {
            ctx.status = 400;
        }
    });

module.exports = router;

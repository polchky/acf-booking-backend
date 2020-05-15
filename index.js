require('module-alias/register');
require('@database');

process.env.TZ = 'Europe/Zurich';

const Koa = require('koa');
const Cors = require('@koa/cors');
const BodyParser = require('koa-bodyparser');
const Router = require('@routes');

const app = new Koa();

const parser = BodyParser({
    onerror: (err, ctx) => {
        ctx.throw(400, 'invalid JSON payload');
    },
});

app
    .use(Cors())
    .use(parser)
    .use(Router())
    .listen(process.env.PORT);

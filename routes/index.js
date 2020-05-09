const CombineRouters = require('koa-combine-routers');

const auth = require('@routes/auth');
const bookings = require('@routes/bookings');
const configs = require('@routes/configs');
const users = require('@routes/users');

const router = CombineRouters([
    auth,
    bookings,
    configs,
    users,
]);

module.exports = router;

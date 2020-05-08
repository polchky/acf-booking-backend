const CombineRouters = require('koa-combine-routers');

const auth = require('@routes/auth');
const bookings = require('@routes/bookings');
const users = require('@routes/users');

const router = CombineRouters([
    auth,
    bookings,
    users,
]);

module.exports = router;

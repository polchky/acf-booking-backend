const auth = require('@middlewares/auth');
const param = require('@middlewares/param');

const middlewares = {
    auth,
    param,
};

module.exports = middlewares;

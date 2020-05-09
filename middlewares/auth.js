const Jwt = require('koa-jwt');
const { roles } = require('@constants');

const resolve = (ctx, next, res) => {
    if (next !== undefined) {
        if (res) return next();
        return ctx.throw(403);
    }
    return res;
};

const auth = {
    jwt: Jwt({ secret: process.env.JWT_SECRET }),

    and: (conditions) => (ctx, next) => {
        const res = conditions.every((condition) => condition(ctx));
        return resolve(ctx, next, res);
    },

    or: (conditions) => (ctx, next) => {
        const res = conditions.some((condition) => {
            if (Array.isArray(condition)) return auth.and(condition)(ctx);
            return condition(ctx);
        });
        return resolve(ctx, next, res);
    },

    hasRole: (role) => (ctx, next) => {
        const res = roles[ctx.state.user.role] >= roles[role];
        return resolve(ctx, next, res);
    },

    hasUserId: (userId) => (ctx, next) => {
        const res = ctx.state.user.userId === (userId || ctx.user.id);
        return resolve(ctx, next, res);
    },

};


module.exports = auth;

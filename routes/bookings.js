const Router = require('koa-router');
const { Booking, Config } = require('@models');
const { auth, param } = require('@middlewares');
const utils = require('@utils');

const getAvailabilities = async (date, locationObject) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Init availabilities object
    const targets = ['default'];
    if (locationObject.targets) targets.push(...locationObject.targets.map((t) => t.distance));
    const av = {};

    for (let target = 0; target < targets.length; target += 1) {
        const targetK = targets[target];
        av[targetK] = {};
        const time = new Date();
        time.setHours(7, 0, 0, 0);
        for (let i = 7; i <= 22; i += 0.5) {
            const timeK = utils.getHM(time);
            time.setMinutes(time.getMinutes() + 30);
            av[targetK][timeK] = {};
            for (let minutes = 60; minutes <= 120; minutes += 30) {
                const durationK = utils.getDuration(minutes);
                av[targetK][timeK][durationK] = locationObject.capacity;
            }
        }
    }

    const bookings = await Booking.find({
        time: today,
    });

    return av;
};

const router = new Router({
    prefix: '/bookings',
});

router
    .use(auth.jwt)
    .param('bookingId', param(Booking))

    .get('/', async (ctx) => {
        let from;
        let to;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (ctx.request.query.from !== undefined) {
            from = new Date(ctx.request.query.from);
            from.setHours(0, 0, 0, 0);
            ctx.assert(!Number.isNaN(from.getTime()), 400);
            ctx.assert(from.getTime() >= today.getTime(), 400);
        } else {
            from = today;
        }

        if (ctx.request.query.to !== undefined) {
            to = new Date(ctx.request.query.to);
            to.setHours(0, 0, 0, 0);
            ctx.assert(!Number.isNaN(to.getTime()), 400);
        } else {
            to = new Date(today);
            to.setDate(to.getDate() + (ctx.state.user.role === 'user' ? 7 : 14));
        }

        ctx.body = await Booking.find({
            time: { $gte: from, $lte: to },
        }).populate('user');
    })

    .get('/available', async (ctx) => {
        const date = new Date(ctx.request.query.date);
        ctx.assert(!Number.isNaN(date.getTime()), 400);
        date.setHours(0, 0, 0, 0);
        const max = new Date();
        max.setHours(0, 0, 0, 0);
        max.setDate(max.getDate() + (ctx.state.user.role === 'user' ? 7 : 14));
        ctx.assert(date <= max, 400);

        const config = await Config.findOne({});
        const { location } = ctx.request.query;
        const locationObject = config.locations.find((l) => l.name === location);
        ctx.assert(locationObject !== null, 400);

        ctx.body = await getAvailabilities(date, locationObject);
    })

    .post('/', async (ctx) => {
        const config = await Config.findOne({});
        const { body } = ctx.request;

        // The user books for himself or is admin

        ctx.assert(ctx.state.user.role === 'admin' || ctx.state.user.userId === body.userId, 403);

        // The time is valid
        const time = new Date(body.time);
        ctx.assert(!Number.isNaN(time.getTime()), 400);
        const max = new Date();
        max.setHours(23, 59, 0, 0);
        max.setDate(max.getDate() + (ctx.state.user.role === 'user' ? 7 : 14));
        ctx.assert(time <= max, 400);

        // The location is valid
        const { location } = body;
        const locationObject = config.locations.find((l) => l.name === location);
        ctx.assert(locationObject !== null, 400);

        const day = new Date(time);
        day.setHours(0, 0, 0, 0);
        const availabilities = await getAvailabilities(day, locationObject);

        try {
            const times = availabilities[body.target || 'default'];
            const durations = times[utils.getHM(time)];
            const freeSpots = durations[utils.getDuration(body.duration)];
            ctx.assert(freeSpots > 0, 400);
            body.user = body.userId;
            const booking = new Booking(body);
            await booking.save();
            ctx.status = 204;
        } catch (err) {
            ctx.status = 400;
        }
    })

    .delete('/:bookingId', async (ctx) => {
        ctx.assert(ctx.state.user.role === 'admin' || ctx.state.user.id === ctx.booking.userId, 403);
        await Booking.deleteOne({ _id: ctx.booking.id });
        ctx.status = 204;
    });

module.exports = router;

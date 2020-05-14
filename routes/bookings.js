const Router = require('koa-router');
const { Booking, Config } = require('@models');
const { auth, param } = require('@middlewares');
const utils = require('@utils');

const getAvailabilities = async (date, locationObject, role) => {

    // Init availabilities object
    const targets = ['default'];
    if (locationObject.targets) targets.push(...locationObject.targets.map((t) => t.distance));
    const av = {};

    for (let target = 0; target < targets.length; target += 1) {
        const targetK = targets[target];
        let targetCapacity;
        if (locationObject.targets && targetK !== 'default') {
            const tar = locationObject.targets.find((t) => t.distance === targetK);
            targetCapacity = tar.number;
        } else {
            targetCapacity = locationObject.capacity;
        }
        av[targetK] = {};
        const time = new Date();
        time.setHours(7, 0, 0, 0);
        for (let i = 7; i <= 22; i += 0.5) {
            const timeK = utils.getHM(time);
            time.setMinutes(time.getMinutes() + 30);
            av[targetK][timeK] = {};
            for (let minutes = 60; minutes <= 120; minutes += 30) {
                const durationK = utils.getDuration(minutes);
                av[targetK][timeK][durationK] = targetCapacity;
            }
        }
    }

    // Get bookings for selected day
    const min = new Date(date);
    min.setHours(7, 0, 0, 0);
    const max = new Date(date);
    max.setHours(22, 0, 0, 0);

    const bookings = await Booking.find({
        location: locationObject.name,
        time: { $gte: min, $lte: max },
    });

    // Decrement availabilities
    for (let i = 0; i < bookings.length; i += 1) {
        const target = bookings[i].target || 'default';
        const time = utils.getHM(bookings[i].time);
        const duration = utils.getDuration(bookings[i].duration);

        // Decrement present and future times
        for (let j = 0; j < bookings[i].duration; j += 30) {
            const realTime = new Date(bookings[i].time);
            realTime.setMinutes(realTime.getMinutes() + j);
            const realTimeString = utils.getHM(realTime);
            if (av[target][realTimeString] !== undefined) {
                for (let k = 60; k <= 120; k += 30) {
                    av[target][realTimeString][utils.getDuration(k)] -= 1;
                }
            }
        }

        // Decrement previous times
        for (let j = 30; j <= 90; j += 30) {
            const realTime = new Date(bookings[i].time);
            realTime.setMinutes(realTime.getMinutes() - j);
            const realTimeString = utils.getHM(realTime);
            for (let k = 120; k > j; k -= 30) {
                if (av[target][realTimeString] !== undefined) {
                    av[target][realTimeString][utils.getDuration(k)] -= 1;
                }
            }
        }
    }

    // Remove full days and Jura empty days
    for (let i = 0; i < targets.length; i += 1) {
        const times = Object.keys(av[targets[i]]);
        for (let j = 0; j < times.length; j += 1) {
            const durations = Object.keys(av[targets[i]][times[j]]);
            for (let k = 0; k < durations.length; k += 1) {
                // Remove empty session for Jura
                if (
                    targets[i] === 'Jura'
                    && role === 'user'
                    && av[targets[i]][times[j]][durations[k]] === locationObject.capacity
                ) {
                    av[targets[i]][times[j]][durations[k]] = 0;
                }
                // Remove full durations
                if (av[targets[i]][times[j]][durations[k]] <= 0) {
                    delete av[targets[i]][times[j]][durations[k]];
                }
            }
            // Remove empty times
            if (Object.keys(av[targets[i]][times[j]]).length === 0) {
                delete av[targets[i]][times[j]];
            }
        }
        // Remove empty targets
        if (Object.keys(av[targets[i]]).length === 0) {
            delete av[targets[i]];
        }
    }

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
            to.setHours(23, 0, 0, 0);
            ctx.assert(!Number.isNaN(to.getTime()), 400);
        } else {
            to = new Date(today);
            to.setDate(to.getDate() + (ctx.state.user.role === 'user' ? 7 : 14));
        }

        ctx.body = await Booking.find({
            time: { $gte: from, $lte: to },
        }).populate('user', 'username');

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

        ctx.body = await getAvailabilities(date, locationObject, ctx.state.user.role);
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
        const availabilities = await getAvailabilities(day, locationObject, ctx.state.user.role);

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

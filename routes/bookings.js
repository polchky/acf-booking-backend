const Router = require('koa-router');
const constants = require('@constants');
const { Booking, User } = require('@models');
const { auth, param } = require('@middlewares');

const router = new Router({
    prefix: '/bookings',
});

router
    .use(auth.jwt)
    .param('bookingId', param(Booking))

    .get('/', async (ctx) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        ctx.body = await Booking.find({
            time: { $gte: today },
        });
    })

    .post('/', async (ctx) => {
        try {
            const { body } = ctx.request;
            // The user books for himself or is admin
            ctx.assert(ctx.state.user.role === 'admin' || ctx.state.user.id === body.userId, 403);
            // The location is valid
            ctx.assert(constants.quotas.locations[body.location] !== undefined, 400);
            // The target is valid or empty
            ctx.assert(constants.quotas.targets[body.target] !== undefined || !body.target, 400);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const time = new Date(body.time);
            // The time is valid
            ctx.assert(!Number.isNaN(time.getTime()), 400);
            time.setMinutes(0, 0, 0);
            // The time is not before today
            ctx.assert(time >= today, 400);

            const nextWeeks = new Date();
            nextWeeks.setHours(23, 0, 0, 0);
            nextWeeks.setDate(nextWeeks.getDate() + 7);
            // The booking is within a week for normal users
            ctx.assert(time <= nextWeeks || ['admin', 'moderator'].includes(ctx.state.user.role), 400);
            nextWeeks.setDate(nextWeeks.getDate() + 7);
            // The booking is within two weeks for moderators
            ctx.assert(time <= nextWeeks || ctx.state.user.role === 'admin', 400);

            const before = new Date(time);
            before.setHours(before.getHours() - 1);
            const after = new Date(time);
            after.setHours(after.getHours() + 1);

            const overlaps = await Booking.find({
                time: { $gte: before, $lte: after },
                location: body.location,
                userId: ctx.state.user.id,
            });

            // The user did not make any booking around this one
            ctx.assert(overlaps.length === 0, 400);

            const currentBookings = await Booking.find({
                time,
                location: body.location,
            });

            const previousBookings = await Booking.find({
                time: before,
                location: body.location,
            });
            previousBookings.push(...currentBookings);

            const nextBookings = await Booking.find({
                time: after,
                location: body.location,
            });
            nextBookings.push(...currentBookings);

            // There is room at location now and before
            ctx.assert(previousBookings.length < constants.quotas.locations[body.location], 400);

            // There is room at location now and after
            ctx.assert(currentBookings.length < constants.quotas.locations[body.location], 400);

            if (body.target) {
                const previousTargets = previousBookings.reduce(
                    (acc, cur) => (cur.target === body.target ? acc + 1 : acc),
                );
                // There are available targets now and before
                ctx.assert(previousTargets < constants.quotas.targets[body.target], 400);

                const nextTargets = nextBookings.reduce(
                    (acc, cur) => (cur.target === body.target ? acc + 1 : acc),
                );
                // There are available target now and after
                ctx.assert(nextTargets < constants.quotas.targets[body.target]);
            }

            const booking = new Booking(body);
            await booking.save();
            ctx.body = booking;

            ctx.status = 201;
        } catch (err) {
            ctx.status = 400;
        }
    })

    .delete('/:bookingId', auth.or(auth.hasUserId(), auth.hasRole('admin')), async (ctx) => {
        await Booking.deleteOne({ _id: ctx.booking.id });
        ctx.status = 204;
    });

module.exports = router;

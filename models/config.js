const Mongoose = require('mongoose');

const targetSchema = new Mongoose.Schema({
    distance: { type: Number, required: true },
    number: { type: Number, required: true },
});

const locationSchema = new Mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    restricted: { type: Boolean, required: true },
    targets: [targetSchema],
});

const durationSchema = new Mongoose.Schema({
    minutes: { type: Number, required: true },
});

const configSchema = new Mongoose.Schema({
    locations: [locationSchema],
    durations: [durationSchema],
}, { timestamps: true });

module.exports = Mongoose.model('Config', configSchema);

/*
const config = {
    _id: ObjectId(),
    locations: [
        {
            _id: ObjectId(),
            name: 'Guintzet',
            capacity: 5,
            restricted: false,
            targets: [
                {
                    _id: ObjectId(),
                    distance: 15,
                    number: 2,
                },
                {
                    _id: ObjectId(),
                    distance: 30,
                    number: 3,
                },
                {
                    _id: ObjectId(),
                    distance: 50,
                    number: 2,
                },
                {
                    _id: ObjectId(),
                    distance: 70,
                    number: 2,
                },
            ],
        },
        {
            _id: ObjectId(),
            name: 'Jura',
            capacity: 3,
            restricted: true,
        },
        {
            _id: ObjectId(),
            name: 'Lossy',
            capacity: 5,
            restricted: false,
        },
    ],
    durations: [
        {
            _id: ObjectId(),
            minutes: 60,
        },
        {
            _id: ObjectId(),
            minutes: 90,
        },
        {
            _id: ObjectId(),
            minutes: 120,
        },
    ],
};
*/

const Mongoose = require('mongoose');

const { Schema } = Mongoose;

const bookingSchema = new Mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    time: { type: Date, required: true },
    location: { type: String, required: true },
    target: { type: String },
}, { timestamps: true });

module.exports = Mongoose.model('Booking', bookingSchema);

const Mongoose = require('mongoose');

const { Schema } = Mongoose;

const bookingSchema = new Mongoose.Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    time: { type: Date, required: true },
    location: { type: String, required: true },
    target: { type: String },
    duration: { type: Number, required: true },
}, { timestamps: true });

module.exports = Mongoose.model('Booking', bookingSchema);

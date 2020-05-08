const Mongoose = require('mongoose');

const countSchema = new Mongoose.Schema({
    _id: { type: Number },
    comments: { type: Number, required: true },
    replies: { type: Number, required: true },
    single: { type: Number, required: true },
    multiple: { type: Number, required: true },
    timestamp: { type: Date, required: true },
});

module.exports = Mongoose.model('Count', countSchema);

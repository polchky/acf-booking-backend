const Mongoose = require('mongoose');

const userSchema = new Mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    registrationToken: { type: String },
    passwordToken: { type: String },
}, { timestamps: true });

module.exports = Mongoose.model('User', userSchema);

const Mongoose = require('mongoose');

Mongoose.plugin((schema) => {
    schema.options.toJSON = {
        versionKey: false,
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        },
    };
});

Mongoose.connect(process.env.MONGODB_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
});

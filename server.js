const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    console.log(err);
    process.exit(1);
});

// Set ENV variables from config.env
dotenv.config({path: './config.env'});

const app = require("./app");

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})
    .then(() => console.log('DB connected...'))
    .catch(err => console.log(err));


// Start Server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err);
    server.close(() => {
        process.exit(1);
    });
});


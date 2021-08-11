const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

// Set ENV variables from config.env
dotenv.config({path: './config.env'});

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true
})
    .then(() => console.log('DB connected...'))
    .catch(err => console.log(err));

// Read JSON file which the data will be imported from
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// Import predefined data to the DB
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data imported successfully!');
    } catch (err) {
        console.log(err);
    } finally {
        process.exit();
    }
};

// Delete all data from the DB
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data deleted successfully!');
    } catch (err) {
        console.log(err);
    } finally {
        process.exit();
    }
};

/*
Run in the terminal the command to execute the script:
'node dev-data/data/import-dev-data.js --import' - to import the data to the DB
'node dev-data/data/import-dev-data.js --delete' - to delete all data from the DB
*/
if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}
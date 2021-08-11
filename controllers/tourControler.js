const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const {
    getAll,
    createOne,
    updateOne,
    getOne,
    deleteOne
} = require("./handlerFactory");

// Save the file to the memory as buffer
const multerStorage = multer.memoryStorage();

// Filters out all not 'image' type file uploads
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not an image, please upload only images!', 400),
            false
        )
    }
};

// Initialize the 'upload' object
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// Define the field types and max count
exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    // Move on if no uploads
    if (!req.files.imageCover || !req.files.images) return next();

    // --- Image processing ---

    //  1) Cover image

    // Set file name as imageCover property to req.body so it gets picked up by the tour updating function
    //   Format: tour-{tourId}-{timestamp}-cover => tour-j7defs334434df-123243434-cover.jpeg
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    // Resize, format and save uploaded image
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg', { quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);


    //  2) Images
    req.body.images = [];

    // Loop through the images array and since on each iteration a new promise is returned
    // .map is used instead of .forEach to collect them into a new Promise array and await them all together
    await Promise.all(
        req.files.images.map(async (file, i) => {
            // Set file name
            //   Format: tour-{tourId}-{timestamp}-{number} => tour-j7defs334434df-123243434-1.jpeg
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

            // Resize, format and save uploaded image
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg', { quality: 90 })
                .toFile(`public/img/tours/${filename}`);

            // Add each image filename to the req.body.images array so they get picked up by the tour updating function
            req.body.images.push(filename);
        })
    );

    next();
});

exports.getTourBySlug = catchAsync(async (req, res, next) => {
    const slug = req.params.slug;

    const doc = await Tour.findOne({ slug }).populate({ path: 'reviews' });

    if (!doc) {
        return next(new AppError('No document found with this name', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.getBookedTours = catchAsync(async (req, res, next) => {
    const userId = req.user._id;

    const bookings = await Booking
        .find({ user: userId, paid: true, status: 'completed' });

    const bookedToursId = bookings.map(b => b.tour._id);

    const bookedTours = await Tour
        .find({ '_id': { $in: bookedToursId }});

    res.status(200).json({
        status: 'success',
        results: bookedTours.length,
        data: {
            data: bookedTours
        }
    });
});

exports.getTour = getOne(Tour, { path: 'reviews' });

exports.getAllTours = getAll(Tour);

exports.createTour = createOne(Tour);

exports.updateTour = updateOne(Tour);

exports.deleteTour = deleteOne(Tour);

// Middleware to manipulate the query string for a predefined route '/top-5-cheap'
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    next()
};

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: {$gte: 4.5}}
        },
        {
            $group: {
                _id: {$toUpper: '$difficulty'},
                numTours: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgRating: {$avg: '$ratingsAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'}
            }
        },
        {
            $sort: {avgPrice: 1}
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = Number(req.params.year);

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {$month: '$startDates'},
                numTourStarts: {$sum: 1},
                tours: {$push: '$name'}
            }
        },
        {
            $addFields: {month: '$_id'}
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {numTourStarts: -1}
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
        next(
            new AppError('Please provide latitude and longitude in the correct format (lat,lng).', 400)
        );
    }

    // Calculates the radiance by dividing the distance by the Earth's radius in miles or kilometers respectively
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    // Filters the tours that fall within the provided radius from the provided coordinates
    // based on each tour's start location using the geospatial operators
    const tours = await Tour.find({
        startLocation: {
            $geoWithin: { $centerSphere: [[lng, lat], radius] }
        }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
        next(
            new AppError('Please provide latitude and longitude in the correct format (lat,lng).', 400)
        );
    }

    // Create a multiplier based on the unit in order to convert the value from meters to the desired unit
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

/*
    $geoNear must be at the first stage and needs at least one geospatial index ('2dsphere') in order to work
    'near' - GeoJSON object which to calculate the distances from - calculates between this point and all the startLocations
    'distanceField' - sets the name of the field where all the distances will be stored
    'distanceMultiplier' - optional multiplier to be applied on the distance value since it's returned in meters by default
*/
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [Number(lng), Number(lng)]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
});


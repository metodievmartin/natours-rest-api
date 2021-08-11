const mongoose = require('mongoose');
const slugify = require("slugify");

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must be maximum 40 characters long'],
        minlength: [10, 'A tour name must be at least 10 characters long'],
        //validate: [validator.isAlpha, 'Tour name must contain only characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a maximum group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty must be one of the following: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'The rating cannot be less than 1.0'],
        max: [5, 'The rating cannot be greater than 5.0'],
        set: val => Math.round(val * 10) / 10
        // Multiplying then dividing by 10 to keep the rounded num as floating point (4.6666 => 46.666 => 47 => 4.7)
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
        min: [0, 'The price cannot be less than 0']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                // 'this' refers to the current doc only on NEW document creation /won't work on update doc/
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be bellow regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have an image cover']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// -- VIRTUAL FIELDS --

// Create a virtual field 'durationWeeks' displayed only in the response
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});

// Create virtual field 'reviews' and populate it with all the reviews from the 'Review' schema
// that are parent referencing to the current tour
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// -- SCHEMA INDEXES --

// Compound index of the price in ASC & the averageRating in DESC order
tourSchema.index({ price: 1, averageRating: -1 });

// Index of the tour slug in ASC
tourSchema.index({ slug: 1 });

// Index of GeoJSON obj using geospatial index type '2dsphere' - which
// supports queries that calculate geometries on an earth-like sphere.
tourSchema.index({ startLocation: '2dsphere' });

// -- DOCUMENT MIDDLEWARE --
// runs before .save() and .create() /won't work on update doc/

// Create a slug based on the name of the tour - ("The Sea Explorer" -> "the-sea-explorer")
tourSchema.pre('save', function(next) {
    //'this' refers to the document that is to be saved
    this.slug = slugify(this.name, { lower: true });

    next();
});

// -- QUERY MIDDLEWARE --
// Using regex to match all the methods starting with 'find' (findOne(), findByID(), etc.)
// otherwise it will run only for the .find() method

// Filter out the secret tours
tourSchema.pre(/^find/, function(next) {
    //'this' refers to the query object
    this.find({ secretTour: { $eq: false } });

    next();
});

// Populate the 'guides' field with the user data on each request, querying by the stored user id references
tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
})

/*
Middleware to embed the users into the tour document
tourSchema.pre('save', async function(next) {
    const guidesPromises = this.guides.map(async id => await User.findById(id));
    this.guides = await Promise.all(guidesPromises);
    next();
});
*/

// -- AGGREGATION MIDDLEWARE --
/*tourSchema.pre('aggregate', function(next) {
   //'this' refers to the aggregation object
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

    next();
});*/

module.exports = mongoose.model('Tour', tourSchema);
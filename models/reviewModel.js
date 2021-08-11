const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// -- SCHEMA INDEXES --

// Creates a compound index of the tourID & userID and set the combination to unique
// in order prevent duplicate reviews (one review by user per tour allowed)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// -- STATIC METHODS --

// Calculates the average rating & the reviews count for a provided tour and updates in the DB
reviewSchema.statics.calcAverageRating = async function(tourId) {
    // 'this' refers to the current model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // Update the tour with the new values, in case there are no reviews set default values
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        }, {
            useFindAndModify: false
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        },{
            useFindAndModify: false
        });
    }
};

// -- DOCUMENT MIDDLEWARE --

// Runs each time a new review is created in order to update the parent tour with the new values
reviewSchema.post('save', async function () {
    // 'this' refers to the current review

    // Call the static method on the review model to calculate the new avg rating & review count & save it to the tour
    await this.constructor.calcAverageRating(this.tour);
    // Review.calcAverageRating(this.tour);
});

// -- QUERY MIDDLEWARE --
// Uses regex to match all the methods starting with 'find' (findOne(), findByID(), etc.)
// otherwise it will run only for the .find() method

// Populates the 'tour' & 'user' fields with the selected data on each request,
// querying by the stored 'tour' & 'user' id references
reviewSchema.pre(/^find/, function (next) {
    /*
    this.populate({
            path: 'tour',
            select: 'name'
        }).populate({
            path: 'user',
            select: 'name photo'
        });
        */

    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next()
});

// Decorates the 'this' object for the 'post' middleware
reviewSchema.pre(/^findOneAnd/, async function(next) {
    // Since we don't have access to the current review document in the query middleware
    // we fetch it and attach it to the 'this' obj so that we can access it from the 'post' middleware func
   this.r = await this.findOne();

   next();
});

// Runs on each findOneAndUpdate() or findOneAndDelete() called on the review
// in order to update the parent tour with the new values
reviewSchema.post(/^findOneAnd/, async function() {
    // await this.findOne(); does NOT work here, query has already executed - using the previously attached 'r' obj

    // Call the static method on the review model to calculate the new avg rating & review count & save it to the tour
    await this.r.constructor.calcAverageRating(this.r.tour);
});

module.exports = mongoose.model('Review', reviewSchema);
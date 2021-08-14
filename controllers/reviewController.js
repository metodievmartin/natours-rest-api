const Review = require('./../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const {
    getAll,
    createOne,
    updateOne,
    getOne,
    deleteOne
} = require("./handlerFactory");

exports.getCurrentUserReviews = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    // Execute the query
    const reviews = await Review.find({ user: userId });

    // Send response
    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            data: reviews
        }
    });
});

exports.getAllReviews = getAll(Review);

exports.getReview = getOne(Review);

exports.createReview = createOne(Review);

exports.updateReview = updateOne(Review);

exports.deleteReview = deleteOne(Review);

// A middleware that ensures 'tour ID' and 'user ID' are being added to req.body
// thus allows nested routes and could handle calls from both '/api/v1/reviews' & '/api/v1/tours/:tourId/reviews'
exports.setTourAndUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    next();
};
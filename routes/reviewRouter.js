const express = require('express');

const { protect, restrictTo } = require("../controllers/authController");
const {
    getAllReviews,
    setTourAndUserIds,
    createReview,
    updateReview,
    getReview,
    deleteReview
} = require('./../controllers/reviewController');

// '/api/v1/reviews' & '/api/v1/tours/:tourId/reviews' (nested route)
// Create the router with the mergeParams option
// so that it will have access to the req.params coming from mounted/nested routers
const router = express.Router({ mergeParams: true })

// Use the protect middleware here to auth guard all of the routes below
router.use(protect);

router.route('/')
    .get(getAllReviews)
    .post(restrictTo('user'), setTourAndUserIds, createReview);

router.route('/:id')
    .get(getReview)
    .patch(restrictTo('user', 'admin'), updateReview)
    .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
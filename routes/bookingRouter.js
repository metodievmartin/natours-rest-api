const express = require('express');

const { protect, restrictTo } = require("../controllers/authController");
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

// Auth protect all the routes bellow
router.use(protect)

router.post('/checkout-session', bookingController.getCheckoutSession);

router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(restrictTo('admin', 'lead-guide'), bookingController.createBooking);

router
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(restrictTo('admin', 'lead-guide'), bookingController.updateBooking)
    .delete(restrictTo('admin', 'lead-guide'), bookingController.deleteBooking);

module.exports = router;
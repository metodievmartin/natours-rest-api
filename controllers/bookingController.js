const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("../utils/AppError");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.body.tourId);

    // 2) Check if such tour exists
    if (!tour) {
        return next(new AppError('No tour found with this ID', 400));
    }

    // 3) Create a booking with pending status
    const booking = await Booking.create({
        tour: tour._id,
        user: req.user._id,
        price: tour.price
    });

    // 4) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.body.callBackUrl}/?purchaseResult=success&booking=${booking._id.toString()}`,
        cancel_url: `${req.body.callBackUrl}/?purchaseResult=failed&tour=${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: booking._id.toString(),
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100, // convert the price in cents
                currency: 'usd',
                quantity: 1
            }
        ]
    });

    // 3) Send the session as response to the client
    res.status(200).json({
        status: 'success',
        data: {
            checkoutSessionId: session.id,
            stripePublicKey: process.env.STRIPE_PUBLIC_KEY
        }
    })
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();

    await Booking.create({ tour, user, price });

    // Remove the query params from the URL
    const url = req.originalUrl.split('?')[0];

    res.redirect(url);
});

exports.createBooking = factory.createOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.getBooking = factory.getOne(Booking);

exports.getAllBookings = factory.getAll(Booking);
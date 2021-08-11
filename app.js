const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const bookingRouter = require('./routes/bookingRouter');
const webhooksRouter = require('./routes/webhooksRouter');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/AppError');


const app = express();


// -- GLOBAL MIDDLEWARES --

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//CORS policy
app.use(cors());

// Set security HTTP headers
app.use(helmet());

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    'https://cdnjs.cloudflare.com/',
    'https://js.stripe.com/'
];
const styleSrcUrls = [
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    'https://js.stripe.com/'

];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
    'https://cdnjs.cloudflare.com',
    'https://js.stripe.com/',

];
const fontSrcUrls = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'https://js.stripe.com/'
];

const frameSrcUrls = [
    'https://js.stripe.com/'
];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
            frameSrc: ["'self'", ...frameSrcUrls]
        },
    })
);

// Development request logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP address. Please try again in an hour!'
});
app.use('/api', limiter);

// Body parser - reading data from body into req.body for all non-webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === '/payments/checkout/stripe-webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Parses the cookies to the req.cookies obj
app.use((req, res, next) => {
    if (req.originalUrl === '/payments/checkout/stripe-webhook') {
        next();
    } else {
        cookieParser()(req, res, next);
    }
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution & whitelist only the desired fields
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsAverage',
        'ratingsQuantity',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

// Compress the response body for all request
app.use(compression());


// --ROUTES--

// Stripe API webhooks

app.use(
    '/payments/checkout/stripe-webhook',
    express.raw({type: 'application/json'}),
    webhooksRouter
);
// API routes

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.use('/api', (req, res) => {
    res.status(200).json({status: 'success', message: 'Natours RestAPI is up and running!'})
});

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

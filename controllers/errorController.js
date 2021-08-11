const AppError = require("../utils/AppError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;

    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data: ${errors.join('. ')}`;

    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = `Duplicate field value: ${value}. Please use another value!`;

    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleExpiredJWTError = () => new AppError('Your token has expired. Please log in again!', 401);

const sendErrorDev = (err, req, res) => {
    // A) API ERRORS -----
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }

    // B) RENDERED WEBSITE -----
    console.error('ERROR:', err);

    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        message: err.message
    });

};

const sendErrorProd = (err, req, res) => {
    // A) API ERRORS -----
    if (req.originalUrl.startsWith('/api')) {
        // A1) Operational, trusted error: send message to the client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        // A2) Programming or other unknown error: don't leak error details
        //      1) Log error
        console.error('ERROR: ', err);

        //      2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }

    // B) RENDERED WEBSITE -----
    //  B1) Operational, trusted error: send message to the client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            message: err.message,
        });
    }
    //  B2) Programming or other unknown error: don't leak error details
    //      1) Log error
    console.error('ERROR: ', err);

    //      2) Send generic message
    return res.status(500).render('error', {
        title: 'Something went wrong!',
        message: 'Please try again later.'
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {

        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = err;
        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleExpiredJWTError();
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        //if (err.statusCode === 404) error = err;

        sendErrorProd(error, req, res);
    }

    next();
};
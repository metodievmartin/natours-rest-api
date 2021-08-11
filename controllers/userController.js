const multer = require('multer');
const sharp = require('sharp');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require("../utils/AppError");
const { getAll, updateOne, getOne, deleteOne } = require("./handlerFactory");

// Photo upload storage settings
/*const multerStorage = multer.diskStorage({
   destination: (req, file, cb) => {
       // Set file destination folder
       cb(null, 'public/img/users');
   },
    filename: (req, file, cb) => {
       // Set file name and extension
       //   user-{user._id}-{timestamp}.{file extension} => user-j7dhfsdj334434df-123243434.jpeg
       const ext = file.mimetype.split('/')[1];
       cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
    }
});*/

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    // Move on if no upload
    if (!req.file) return next();

    // Set file name to req.file.filename for it's needed in updateMe()
    //   Format: user-{user._id}-{timestamp} => user-j7defs334434df-123243434.jpeg
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    // Image processing - resize, format and save uploaded image
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg', { quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

exports.getAllUsers = getAll(User);

exports.getUser = getOne(User);

// Do NOT update passwords with this - use the dedicated authController handler (updatePassword)
exports.updateUser = updateOne(User);

exports.deleteUser = deleteOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError('This route is not for password updates. Please use /updateMyPassword route', 400)
        );
    }

    // 2) Filter out unwanted field names thus leaving only the desired legit ones
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 2.1) Check if there's an uploaded photo and add its name as a filteredBody property
    if (req.file) filteredBody.photo = req.file.filename;

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
   await User.findByIdAndUpdate(req.user.id, { active: false });

   res.status(204).json({
      status: 'success',
      data: null
   });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined! Please use /signup instead'
    });
};

// Middleware that sets the current user ID to req.params so that the current user can be fetched using the factory handler
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};


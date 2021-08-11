const express = require("express");
const authCtrl = require("../controllers/authController");
const userCtrl = require("../controllers/userController");

// '/api/v1/users'
const router = express.Router();

// Authorization actions endpoints - access by everyone
router.post('/signup', authCtrl.signup);
router.post('/login', authCtrl.login);
router.get('/logout', authCtrl.logout);

// Password actions endpoints - access by everyone
router.post('/forgotPassword', authCtrl.forgotPassword);
router.patch('/resetPassword/:token', authCtrl.resetPassword);
// - access by logged users
router.patch( '/updateMyPassword', authCtrl.protect, authCtrl.updatePassword);

// Use the protect middleware here to auth guard all of the routes below
router.use(authCtrl.protect);

// Current user actions endpoints - access by logged users
router.get('/me', userCtrl.getMe, userCtrl.getUser);
router.patch( '/updateMe', userCtrl.uploadUserPhoto, userCtrl.resizeUserPhoto, userCtrl.updateMe);
router.delete( '/deleteMe', userCtrl.deleteMe);

// Use middleware here to restrict the access by role to all of the routes below
router.use(authCtrl.restrictTo('admin'));

// Users CRUD actions - access by logged admin users only
router.route('/')
    .get(userCtrl.getAllUsers)
    .post(userCtrl.createUser);

router.route('/:id')
    .get(userCtrl.getUser)
    .patch(userCtrl.updateUser)
    .delete(userCtrl.deleteUser);

module.exports = router;
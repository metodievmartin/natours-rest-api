const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Your password cannot be less than 8 characters'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on SAVE and CREATE
            validator: function (currentVal) {
                return currentVal === this.password;
            },
            message: 'Password don\'t match'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// User model middleware----

// Encrypts password before saving it
userSchema.pre('save', async function (next) {
    // Runs only when the password has been modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Clear the passwordConfirm field
    this.passwordConfirm = undefined;

    next();
});

// Updates passwordChangedAt property upon password changing
userSchema.pre('save', function(next) {
    // Runs only when the password has been modified excluding newly created docs
    if (!this.isModified('password') || this.isNew) return next();

    // Subtract 1 second to ensure the timestamp at passwordChangedAt
    // will not be greater than the JWT's iat timestamp (the token may be issued before the data was saved)
    this.passwordChangedAt = Date.now() - 1000;

    next();
});

// Adds filtration to each query starting with 'find' to only show the active users (not deleted ones)
userSchema.pre(/^find/, function(next){
   // this points out to the current query
   this.find({ active: true });
   next()
});

// User model instance methods----
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function(JWTTimestamp) {
    // This field will exist only if the password has ever been changed
    if (this.passwordChangedAt) {
        // Convert the date to the format used by JWT (timestamp in milliseconds)
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        // Returns true if the password has been changed after issuing the JWT
        return JWTTimestamp < changedTimestamp;
    }

    // Default case - password never changed
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

  // Set the token expiration to 10 minutes
  this.passwordResetExpires = Date.now() + (10 * 60 * 1000);

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
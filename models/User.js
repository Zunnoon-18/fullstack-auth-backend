const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,

    isVerified: {
        type: Boolean,
        default: false
    },

    otp: String,
    otpExpiry: Date,

    resetToken: String,
    resetTokenExpiry: Date
});

module.exports = mongoose.model("User", userSchema);
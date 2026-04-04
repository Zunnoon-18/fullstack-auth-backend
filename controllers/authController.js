const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");


// EMAIL SETUP
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});


// ================= SIGNUP =================
exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password)) {
            return res.status(400).json({ message: "Weak password" });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "Email exists" });

        const hashed = await bcrypt.hash(password, 10);

        // GENERATE OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user = new User({
            name,
            email,
            password: hashed,
            otp,
            otpExpiry: Date.now() + 300000 // 5 min
        });

        await user.save();

        // SEND EMAIL
        await transporter.sendMail({
            to: email,
            subject: "Verify Your Email",
            text: `Your OTP is: ${otp}`
        });

        res.json({ message: "OTP sent to email" });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


// ================= VERIFY OTP =================
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.json({ message: "Email verified successfully" });
};


// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        if (!user.isVerified) {
            return res.status(400).json({ message: "Please verify your email first" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token });

    } catch {
        res.status(500).json({ message: "Server error" });
    }
};


// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "No user found" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;

    await user.save();

    res.json({
        resetLink: `https://fulstack-auth.netlify.app/reset.html?token=${resetToken}`
    });
};


// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid token" });

    const hashed = await bcrypt.hash(password, 10);

    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
};
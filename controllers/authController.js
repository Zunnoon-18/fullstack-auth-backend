const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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

        user = new User({ name, email, password: hashed });
        await user.save();

        res.status(201).json({ message: "Signup success" });

    } catch {
        res.status(500).json({ message: "Server error" });
    }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

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
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

    await user.save();

    // For now (dev): send link in response
    res.json({
        message: "Reset link generated",
        resetLink: `http://localhost:5500/reset.html?token=${resetToken}`
    });
};


// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(password, 10);

    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
};
const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

router.post("/signup", signup);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});

module.exports = router;
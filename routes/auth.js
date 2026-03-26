const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");

// ✅ ADD THESE
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");


// ================= AUTH ROUTES =================
router.post("/signup", signup);
router.post("/login", login);


// ================= GET CURRENT USER =================
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
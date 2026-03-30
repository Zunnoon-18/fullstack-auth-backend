const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");


// ================= ROUTES =================
router.post("/signup", signup);
router.post("/login", login);


// ================= GET USER =================
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
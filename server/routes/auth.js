const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// SIGN UP
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, rollNumber, password, role } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    // never let people self-register as admin
    const safeRole = ["student", "faculty"].includes(role) ? role : "student";

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, ...(rollNumber ? [{ rollNumber }] : [])] });
    if (exists) return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ fullName, email, rollNumber, password: hashed, role: safeRole });

    res.status(201).json({ message: "Account created" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { identifier, password, role } = req.body; // email OR roll number

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { rollNumber: identifier }]
    });
    if (!user || user.role !== role)
      return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_TTL }
    );

    res.json({
      accessToken,
      user: { id: user._id, fullName: user.fullName, role: user.role, onboarded: user.onboarded }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
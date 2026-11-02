const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  rollNumber: { type: String, unique: true, sparse: true },
  password:   { type: String, required: true },   // stored hashed
  role:       { type: String, enum: ["student", "faculty", "admin"], default: "student" },
  onboarded:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
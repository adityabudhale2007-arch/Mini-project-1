require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const accounts = [
  { fullName: "Admin",           email: "admin@smart.edu",      password: "Admin@123",   role: "admin" },
  { fullName: "Demo Faculty",    email: "faculty@smart.edu",    password: "Faculty@123", role: "faculty" },
  { fullName: "Demo Student",    email: "student@smart.edu",    password: "Student@123", role: "student", onboarded: true },
  { fullName: "New Student",     email: "newstudent@smart.edu", password: "Student@123", role: "student", onboarded: false }
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const a of accounts) {
    const exists = await User.findOne({ email: a.email });
    if (exists) { console.log("Already exists:", a.email); continue; }
    await User.create({ ...a, password: await bcrypt.hash(a.password, 10) });
    console.log("Created:", a.email, `(${a.role})`);
  }

  await mongoose.disconnect();
})();
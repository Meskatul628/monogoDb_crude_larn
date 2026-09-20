const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Security: By default query result-এ পাসওয়ার্ড আসবে না
    },
  },
  {
    timestamps: true, // createdAt and updatedAt automatically managed
  }
);

// 🔒 ১. ডাটাবেজে সেভ হওয়ার ঠিক আগে পাসওয়ার্ড হ্যাশ করার Pre-save Hook
userSchema.pre("save", async function (next) {
  // যদি পাসওয়ার্ড ফিল্ড পরিবর্তিত না হয়ে থাকে, তবে পরবর্তী স্টেপে চলে যাবে
  if (!this.isModified("password")) return next();

  // Salt তৈরি ও পাসওয়ার্ড হ্যাশ করা
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 ২. লগইনের সময় পাসওয়ার্ড যাচাই করার জন্য Instance Method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
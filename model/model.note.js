const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Note description is required"],
    },
    // এই ফিল্ডটি নির্দিষ্ট ইউজারের সাথে নোটটিকে যুক্ত করে
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt এবং updatedAt স্বয়ংক্রিয়ভাবে ম্যানেজ হবে
  }
);

module.exports = mongoose.model("Note", noteSchema);

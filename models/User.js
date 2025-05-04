const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["farmer", "admin"],
      default: "farmer",
      required: true,
    },
    land_size: { type: Number, default: 0 },
    crop_type: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

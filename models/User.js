const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    id_number: { type: String, required: true, unique: true },
    phone: { type: String, required: true , unique: true},
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["farmer", "admin"],
      default: "farmer",
      required: true,
    },
    land_size: { type: Number, default: 0 },
    crop_type: { type: String },
    id_photo: { type: String, required: true },
  },
  { timestamps: true }
); 

module.exports = mongoose.model("User", userSchema);
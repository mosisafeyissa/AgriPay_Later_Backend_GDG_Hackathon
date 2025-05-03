const mongoose = require("mongoose");

const harvestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    harvest_amount: { type: Number, reqired: true },
    date_logged: { type: Date, default: Date.now },
    crop: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    location: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Harvest", harvestSchema);
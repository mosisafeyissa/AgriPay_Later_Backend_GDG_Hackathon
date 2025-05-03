// models/InputRequest.js
const mongoose = require("mongoose");


const inputRequestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: "kg" }, 
      },
    ],
    preferredDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "fulfilled"],
      default: "pending",
    },
    adminRemarks: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InputRequest", inputRequestSchema);

// models/WarehouseReceipt.js
const mongoose = require("mongoose");

const warehouseReceiptSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    crop_type: {
      type: String,
      required: true,
    },
    quantity_kg: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    stored_at: {
      type: Date,
      default: Date.now,
    },
    receipt_number: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WarehouseReceipt", warehouseReceiptSchema);

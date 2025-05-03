const mongoose = require("mongoose");

const repaymentSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["mobile_money", "bank", "cash"],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    receiptImage: {
      type: String, // path to image file
      required: true,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Repayment", repaymentSchema);

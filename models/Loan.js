const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requested_input: String,
    amount: { type: Number, required: true },
    remainingBalance: {
      type: Number,
      required: true,
    },
    amountRemaining: {
      type: Number,
      required: true,
      default: function () {
        return this.amount;
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "repaid"],
      default: "pending",
    },
    due_date: { type: Date },
    repayment_amount: { type: Number, default: 0 },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin
    created_at: { type: Date, default: Date.now },
    reason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);
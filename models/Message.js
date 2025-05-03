const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin
  to_farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String, required: true },
  type: {
      type: String,
      enum: ["alert", "reminder", "info"],
      default: "info",
    },
  seen: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
},
{ timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
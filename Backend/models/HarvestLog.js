const mongoose = require("mongoose");

const harvestSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  harvest_amount: Number,
  date_logged: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HarvestLog", harvestSchema);

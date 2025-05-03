// models/CropReport.js
const cropReportSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    season: {
      type: String,
      required: true,
    },
    harvest_quantity_kg: {
      type: Number,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropReport", cropReportSchema);

const mongoose = require("mongoose");

const termsConditionsSchema = new mongoose.Schema(
  {
    content: { type: String, required: true }, // The entire policy as HTML
    effectiveDate: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TermsConditions", termsConditionsSchema);

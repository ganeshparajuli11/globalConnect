const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: 50,
    },
    fields: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["text", "textarea", "dropdown", "file", "number"],
          required: true,
        },
        label: { type: String, required: true },
        options: [
          {
            value: { type: String },
            label: { type: String },
          },
        ],
        required: { type: Boolean, default: false },
      },
    ],
    active: { type: Boolean, default: true },  
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);


module.exports = mongoose.model("Category", categorySchema);

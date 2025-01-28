const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true, // Each category name must be unique
      required: [true, "Category name is required"], // Validation for not null
      trim: true, // Removes extra spaces
      maxlength: 50, // Limits the category name to 50 characters
    },
    fields: [
      {
        name: { type: String, required: true }, // Field name (e.g., 'jobTitle', 'description')
        type: {
          type: String,
          enum: ["text", "textarea", "dropdown", "file", "number"], // Supported input types
          required: true,
        },
        label: { type: String, required: true }, // Label for the field (e.g., 'Job Title')
        options: [
          {
            value: { type: String },
            label: { type: String },
          },
        ], // For dropdown fields, include options
        required: { type: Boolean, default: false }, // Whether the field is mandatory
      },
    ],
    created_at: {
      type: Date,
      default: Date.now, // Automatically set the creation timestamp
    },
    updated_at: {
      type: Date, // Optional field for the last edit timestamp
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, // Automatically handle timestamps
  }
);

module.exports = mongoose.model("Category", categorySchema);

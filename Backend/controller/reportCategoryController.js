const ReportCategory = require('../models/reportCategorySchema');

// Controller to create a new report category
exports.createReportCategory = async (req, res) => {
  const { report_title, description } = req.body;

  try {
    // Check if both report_title and description are provided
    if (!report_title || !description) {
      return res.status(400).json({ message: "Report title and description are required." });
    }

    // Create a new report category
    const newCategory = new ReportCategory({
      report_title,
      description
    });

    // Save the new category to the database
    await newCategory.save();

    // Return success response
    return res.status(201).json({
      message: "Report category created successfully.",
      category: newCategory
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating report category.", error: error.message });
  }
};

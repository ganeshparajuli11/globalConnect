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

// Controller to delete a report category
exports.deleteReportCategory = async (req, res) => {
  const categoryId = req.params.id; // Assuming the category ID is passed as a URL parameter

  try {
    // Find the category by ID and delete it
    const deletedCategory = await ReportCategory.findByIdAndDelete(categoryId);

    // Check if category exists
    if (!deletedCategory) {
      return res.status(404).json({ message: "Report category not found." });
    }

    // Return success response
    return res.status(200).json({
      message: "Report category deleted successfully."
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting report category.", error: error.message });
  }
};

// Controller to edit an existing report category
exports.editReportCategory = async (req, res) => {
  const { report_title, description } = req.body;
  const categoryId = req.params.id; // Assuming the category ID is passed as a URL parameter

  try {
    // Check if report title or description is provided
    if (!report_title || !description) {
      return res.status(400).json({ message: "Report title and description are required." });
    }

    // Find the category by ID and update it
    const updatedCategory = await ReportCategory.findByIdAndUpdate(
      categoryId,
      { report_title, description },
      { new: true } // Return the updated document
    );

    // Check if category exists
    if (!updatedCategory) {
      return res.status(404).json({ message: "Report category not found." });
    }

    // Return success response
    return res.status(200).json({
      message: "Report category updated successfully.",
      category: updatedCategory
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating report category.", error: error.message });
  }
};

// Controller to get a specific report category by ID
exports.getReportCategoryById = async (req, res) => {
  const categoryId = req.params.id; // Assuming the category ID is passed as a URL parameter

  try {
    // Find the category by ID
    const category = await ReportCategory.findById(categoryId);

    // Check if category exists
    if (!category) {
      return res.status(404).json({ message: "Report category not found." });
    }

    // Return the category
    return res.status(200).json({
      message: "Report category retrieved successfully.",
      category
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving report category.", error: error.message });
  }
};


// Controller to get all report categories
exports.getAllReportCategories = async (req, res) => {
  try {
    // Retrieve all categories from the database
    const categories = await ReportCategory.find();

    // Return success response with all categories
    return res.status(200).json({
      message: "All report categories retrieved successfully.",
      categories
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving report categories.", error: error.message });
  }
};

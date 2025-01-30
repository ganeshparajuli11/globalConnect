const Category = require('../models/categorySchema');

// get all categories with enhanced error handling
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find(); // Ensure your schema supports fields and active status
    return res.status(200).json({
      message: 'Categories retrieved successfully!',
      categories,
    });
  } catch (error) {
    console.error('Error retrieving categories:', error);
    return res.status(500).json({
      message: 'An error occurred while retrieving categories.',
      error: error.message,
    });
  }
};

const getAllCategoriesUser = async (req, res) => {
  try {
    // Filter categories to only get those where active is true
    const categories = await Category.find({ active: true });

    return res.status(200).json({
      message: 'Categories retrieved successfully!',
      categories,
    });
  } catch (error) {
    console.error('Error retrieving categories:', error);
    return res.status(500).json({
      message: 'An error occurred while retrieving categories.',
      error: error.message,
    });
  }
};


// Controller to create a new category
const createCategory = async (req, res) => {
  try {
    const { name, fields } = req.body;

    // Validate name
    if (!name) {
      return res.status(400).json({ msg: "Category name is required." });
    }

    // Check if a category with the same name already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ msg: "Category with this name already exists." });
    }

    // Validate fields (if provided)
    if (fields && !Array.isArray(fields)) {
      return res.status(400).json({ msg: "Fields must be an array." });
    }

    if (fields) {
      for (const field of fields) {
        if (!field.name || !field.type || !field.label) {
          return res.status(400).json({
            msg: "Each field must have a name, type, and label.",
          });
        }
        if (!["text", "textarea", "dropdown", "file", "number"].includes(field.type)) {
          return res.status(400).json({
            msg: `Invalid field type '${field.type}'. Supported types are: text, textarea, dropdown, file, number.`,
          });
        }
        if (field.type === "dropdown" && field.options && !Array.isArray(field.options)) {
          return res.status(400).json({
            msg: "Dropdown options must be an array.",
          });
        }
      }
    }

    // Create a new category
    const newCategory = new Category({
      name: name.trim(),
      fields: fields || [], // Save fields if provided, otherwise an empty array
    });

    // Save the category to the database
    await newCategory.save();

    return res.status(201).json({
      msg: "Category created successfully!",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res
      .status(500)
      .json({ msg: "An error occurred while creating the category.", error });
  }
};

// Controller to toggle category active status
const toggleCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log('Received Category ID:', categoryId);

    // Check if the ID is valid before querying the database
    if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: "Invalid Category ID format." });
    }

    const category = await Category.findById(categoryId);
    console.log('Category Found:', category);

    if (!category) {
      return res.status(404).json({ msg: "Category not found." });
    }

    category.active = !category.active; // Toggle the active status
    await category.save();

    return res.status(200).json({
      msg: `Category status updated to ${category.active ? "active" : "inactive"}.`,
      category,
    });
  } catch (error) {
    console.error("Error updating category status:", error);
    return res.status(500).json({ msg: "Error updating category status.", error });
  }
};
;

// Controller to delete a category
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({ msg: "Category not found." });
    }

    return res.status(200).json({
      msg: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ msg: "Error deleting category.", error });
  }
};


// get category

module.exports = { createCategory,getAllCategories,toggleCategoryStatus,deleteCategory,getAllCategoriesUser};

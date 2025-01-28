const Category = require('../models/categorySchema');

// get all category
const getAllCategories = async (req, res) => {
  try {

    const categories = await Category.find();

    return res.status(200).json({
      msg: 'Categories retrieved successfully!',
      categories,
    });
  } catch (error) {
    console.error('Error retrieving categories:', error);
    return res.status(500).json({ msg: 'An error occurred while retrieving categories.', error });
  }
};


// Controller to create a new category
const createCategory = async (req, res) => {
  try {
    const { name } = req.body; 
    if (!name) {
      return res.status(400).json({ msg: 'Category name is required.' });
    }

    // Check if a category with the same name already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ msg: 'Category with this name already exists.' });
    }


    const newCategory = new Category({
      name: name.trim(), // Trim the name to remove any extra spaces
    });

    // Save the category to the database
    await newCategory.save();


    return res.status(201).json({
      msg: 'Category created successfully!',
      category: newCategory,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ msg: 'An error occurred while creating the category.', error });
  }
};


// get category

module.exports = { createCategory,getAllCategories};

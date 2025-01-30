const { Post } = require("../models/postSchema"); 

const { comment } = require("../models/commentSchema");
const Category = require("../models/categorySchema"); 
const userSchema = require("../models/userSchema");

// Function to create a post
async function createPost(req, res) {
  try {
    const user_id = req.user.id;
    const { category_id, fields, tags, location, visibility, metadata } = req.body;

    if (!Array.isArray(fields)) {
      return res.status(400).json({ message: "'fields' should be an array." });
    }

    // Validate category existence
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    const categoryFields = categoryExists.fields;
    if (!Array.isArray(categoryFields) || categoryFields.length === 0) {
      return res.status(400).json({ message: "No fields available for this category." });
    }

    // Convert dynamic fields to match text_content format
    const text_content = fields.map(field => ({
      field_name: field.name,
      value: field.value
    }));

    // Process uploaded images
    const media = req.files
      ? req.files.map((file) => ({
          media_path: `/uploads/posts/${file.filename}`,
          media_type: file.mimetype,
          description: "",
        }))
      : [];

    // Create and save the post
    const post = await Post.create({
      user_id,
      category_id,
      text_content,  // <-- Assigning the processed text fields correctly
      media,
      tags,
      location,
      visibility,
      metadata,
    });

    res.status(201).json({
      message: "Post created successfully.",
      data: post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: "An error occurred while creating the post.",
      error: error.message,
    });
  }
}



const getAllPost = async (req, res) => {
  try {
    
    const posts = await Post.find()
      .populate("user_id", "name profilePic") 
      .populate("category_id");  
    const categories = await Category.find(); 
    const formattedPosts = posts.map(post => {
    
      const category = categories.find(cat => cat._id.toString() === post.category_id._id.toString());
      
      let formattedContent = "";

      if (category && category.fields.length > 0) {
        formattedContent = category.fields
          .map(field => {
            const fieldValue = post.text_content.find(item => item.field_name === field.name)?.value;
            return fieldValue ? `${field.name}: ${fieldValue}` : null;
          })
          .filter(Boolean)
          .join("\n");
      }

      return {
        id: post._id,
        user: post.user_id ? post.user_id.name : "Unknown User",  // Use populated user name
        userImage: post.user_id?.profilePic || "",  // Use populated user profilePic
        type: category ? category.name : "Unknown Category",  // Use populated category name
        time: post.createdAt ? post.createdAt.toDateString() : "Unknown Date",
        content: formattedContent || "No content provided",
        image: post.media.length > 0 ? post.media[0].media_path : "",  // Use media if available
        comments: post.comments || [],
        liked: false,  // You may want to modify this logic later to check for likes
      };
    });

    res.json({ message: "Posts retrieved successfully.", data: formattedPosts });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve posts." });
  }
};





module.exports = { createPost, getAllPost };

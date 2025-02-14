const postSchema = require("../models/postSchema");
const User = require("../models/userSchema");

const getUserDetails = async (req, res) => {
  try {
    const user = req.user;
    console.log("Decoded user from token: ", user);

    if (!user || !user.id) {
      return res
        .status(404)
        .json({ message: "User not found in request data." });
    }

    const userDetails = await User.findById(user.id);
    if (!userDetails) {
      return res.status(404).json({ message: "User not found in database." });
    }

    const postsCount = await postSchema.countDocuments({ user_id: user.id });

    // Update the posts_count field if it differs from the count
    if (userDetails.posts_count !== postsCount) {
      userDetails.posts_count = postsCount;
      await userDetails.save();
    }

    res.status(200).json({ data: userDetails });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getUserDetails };

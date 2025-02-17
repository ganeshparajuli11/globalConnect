const User = require("../models/userSchema");
const Post = require("../models/postSchema");

// Share a post with a followed user
const sharePost = async (req, res) => {
    try {
        const { postId, recipientId } = req.body; // Post ID and recipient user ID
        const senderId = req.user.id; // Get current user's ID (assumed to be from auth middleware)

        // Validate post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        // Validate sender follows recipient
        const sender = await User.findById(senderId);
        if (!sender || !sender.following.includes(recipientId)) {
            return res.status(403).json({ success: false, message: "You can only share with users you follow" });
        }

        // Store shared post (this can be modified based on how you want to manage shared posts)
        const sharedPost = {
            originalPost: post._id,
            sharedBy: senderId,
            sharedAt: new Date(),
        };

        await User.findByIdAndUpdate(recipientId, {
            $push: { sharedPosts: sharedPost },
        });

        return res.status(200).json({ success: true, message: "Post shared successfully" });
    } catch (error) {
        console.error("Error sharing post:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { sharePost };

// const User = require("../models/userSchema");
// const Post = require("../models/postSchema");
// const Message = require("../models/messageSchema");
// const { onlineUsers, getIO } = require("./socketController");

// // Share a post with a followed user
// const sharePost = async (req, res) => {
//     try {
//         const { postId, recipientId } = req.body;
//         const senderId = req.user.id;

//         // Validate request data
//         if (!postId || !recipientId) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: "Post ID and recipient ID are required" 
//             });
//         }

//         // Validate post exists and get post with user details
//         const post = await Post.findById(postId);
//         if (!post) {
//             return res.status(404).json({ success: false, message: "Post not found" });
//         }

//         // Validate sender follows recipient and get user details
//         const [sender, recipient] = await Promise.all([
//             User.findById(senderId).select('name following profile_image'),
//             User.findById(recipientId).select('name profile_image blocked_users')
//         ]);

//         if (!sender || !recipient) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }

//         // Check if sender follows recipient
//         if (!sender.following.includes(recipientId)) {
//             return res.status(403).json({ 
//                 success: false, 
//                 message: "You can only share with users you follow" 
//             });
//         }

//         // Check if recipient has blocked sender
//         if (recipient.blocked_users.includes(senderId)) {
//             return res.status(403).json({ 
//                 success: false, 
//                 message: "Cannot share post with this user" 
//             });
//         }

//         // Create a new message with the shared post
//         const message = new Message({
//             sender: senderId,
//             receiver: recipientId,
//             messageType: "post",
//             content: `Shared a post with you`,
//             post: postId,
//             timestamp: new Date()
//         });

//         await message.save();

//         // Prepare the message payload
//         const messagePayload = {
//             senderId,
//             receiverId: recipientId,
//             content: `Shared a post with you`,
//             messageType: "post",
//             postId: post._id,
//             media: post.media && post.media.length > 0 ? post.media[0] : null,
//             timestamp: message.timestamp,
//             senderName: sender.name,
//             senderImage: sender.profile_image,
//             postPreview: {
//                 text: post.text_content?.substring(0, 50),
//                 media: post.media && post.media.length > 0 ? post.media[0] : null
//             }
//         };

//         // Get socket instance and recipient's socket ID
//         const io = getIO();
//         const recipientSocketId = onlineUsers.get(recipientId);

//         // Emit socket events if recipient is online
//         if (io && recipientSocketId) {
//             // Emit message event
//             io.to(recipientSocketId).emit("receiveMessage", messagePayload);

//             // Emit notification event
//             io.to(recipientSocketId).emit("receiveNotification", {
//                 type: "shared_post",
//                 message: `${sender.name} shared a post with you`,
//                 postId: post._id,
//                 senderId: senderId,
//                 timestamp: message.timestamp
//             });
//         }

//         // Update post share count
//         await Post.findByIdAndUpdate(postId, { $inc: { shares: 1 } });

//         return res.status(200).json({
//             success: true,
//             message: "Post shared successfully",
//             data: {
//                 messageId: message._id,
//                 timestamp: message.timestamp,
//                 status: recipientSocketId ? "delivered" : "stored",
//                 recipientOnline: !!recipientSocketId,
//                 messagePayload
//             }
//         });
//     } catch (error) {
//         console.error("Error sharing post:", error);
//         return res.status(500).json({ 
//             success: false, 
//             message: "Failed to share post",
//             error: error.message 
//         });
//     }
// };


// module.exports = { sharePost };

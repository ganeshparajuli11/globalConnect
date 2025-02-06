const User = require('../models/userSchema');
const Message = require('../models/messageSchema');
const { sendFirebaseNotification } = require('./firebaseController');

const canMessage = async (userId1, userId2) => {
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);

    // Check if both users follow each other
    const user1FollowsUser2 = user1.following.includes(userId2);
    const user2FollowsUser1 = user2.followers.includes(userId1);

    return user1FollowsUser2 && user2FollowsUser1;
};

// Send Message
const sendMessage = async (req, res) => {
    try {
        const senderId  = req.user.id; // Extract senderId from authenticated user
        const { receiverId, content } = req.body;

        // Debugging logs
        console.log("SenderId:", senderId);
        console.log("ReceiverId:", receiverId);
        console.log("Content:", content);

        if (!receiverId || !content) {
            return res.status(400).json({ error: 'ReceiverId and content are required.' });
        }

        const canSend = await canMessage(senderId, receiverId);
        if (!canSend) {
            return res.status(403).json({ error: 'You can only message users who follow you and whom you follow.' });
        }

        const message = new Message({ sender: senderId, receiver: receiverId, content });
        await message.save();

        // await sendFirebaseNotification(receiverId, 'New Message', content);

        res.status(200).json({ success: true, message: 'Message sent successfully.', data: message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'An error occurred while sending the message.' });
    }
};





// Controller to get messages for a user
const getMessages = async (req, res) => {
    try {
        const receiverId = req.user.id; // Authenticated user's ID from the middleware
        const { senderId } = req.body; // Friend's ID from the request body

        if (!senderId) {
            return res.status(400).json({
                success: false,
                message: 'Sender ID is required.',
            });
        }

        // Find messages where the sender and receiver match either way
        const messages = await Message.find({
            $or: [
                { sender: receiverId, receiver: senderId },
                { sender: senderId, receiver: receiverId },
            ],
        })
            .sort({ timestamp: 1 }) // Sort messages by timestamp in ascending order
            .populate('sender receiver'); // Populate sender and receiver fields with user data

        if (messages.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No messages found between you and your friend.',
                data: [],
            });
        }

        // Format the messages with sender/receiver details
        const formattedMessages = messages.map((message) => {
            const isCurrentUserSender = message.sender._id.toString() === receiverId;
            return {
                _id: message._id,
                sender: {
                    _id: message.sender._id,
                    name: isCurrentUserSender ? 'You' : message.sender.name, // Replace name with "You" if the sender is the current user
                    avatar: message.sender.avatar,
                },
                receiver: {
                    _id: message.receiver._id,
                    name: message.receiver.name,
                    avatar: message.receiver.avatar,
                },
                content: message.content,
                timestamp: message.timestamp,
            };
        });

        // Respond with the formatted messages
        res.status(200).json({
            success: true,
            message: 'Messages fetched successfully.',
            data: formattedMessages,
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages.',
        });
    }
};



// Controller to get the list of users who have sent messages and their last message
const getAllMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("user id: " + userId);

        // Find messages where the user is either the sender or receiver
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
        })
        .sort({ timestamp: -1 }) // Sort by timestamp in descending order
        .populate('sender receiver', 'name profile_image'); 

        if (!messages.length) {
            return res.status(200).json({
                success: true,
                message: "No messages found.",
                data: [],
            });
        }

        // Respond with the list of users and their last message
        const uniqueUsers = messages.reduce((acc, message) => {
            const user = message.sender._id.toString() === userId.toString() ? message.receiver : message.sender;
            if (!acc[user._id]) {
                acc[user._id] = {
                    userId: user._id,
                    name: user.name,
                    avatar: user.profile_image,  // Set avatar to profile_image
                    lastMessage: message.content,
                    timestamp: message.timestamp,
                };
            }
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            message: "Messages fetched successfully.",
            data: Object.values(uniqueUsers),
        });
        console.log("Message sent from the backend")
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
        });
    }
};








module.exports = { canMessage, sendMessage, getMessages, getAllMessages }
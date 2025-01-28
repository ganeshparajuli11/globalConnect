const socketIo = require('socket.io');

const User = require('../models/userSchema');
const Message = require('../models/messageSchema');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // User joins their personal room
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room.`);
    });

    // Handle sending messages
    socket.on('send_message', async ({ senderId, receiverId, content }) => {
      try {
        // Verify if users can message
        const canSend = await canMessage(senderId, receiverId);
        if (!canSend) {
          return socket.emit('error', 'You can only message users who follow you and whom you follow.');
        }

        // Save message to MongoDB
        const message = new Message({ sender: senderId, receiver: receiverId, content });
        await message.save();

        // Emit message to receiver's room
        io.to(receiverId).emit('receive_message', message);

        // Send Firebase notification
        await sendFirebaseNotification(receiverId, 'New Message', content);
      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('error', 'An error occurred while sending the message.');
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });
};

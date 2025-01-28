const User = require('../models/userSchema');

// Follow a user
const followUser = async (req, res) => {
  try {
    const { userId, followUserId } = req.body;

    // Validate input
    if (!userId || !followUserId) {
      return res.status(400).json({ error: 'Both userId and followUserId are required.' });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    const followUser = await User.findById(followUserId);

    if (!user || !followUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if already following
    if (user.following.includes(followUserId)) {
      return res.status(400).json({ error: 'You are already following this user.' });
    }

    // Add followUserId to user's following list
    user.following.push(followUserId);
    await user.save();

    // Add userId to followUser's followers list
    followUser.followers.push(userId);
    await followUser.save();

    res.status(200).json({ success: true, message: `You are now following ${followUser.name}.` });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'An error occurred while following the user.' });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const { userId, unfollowUserId } = req.body;

    // Validate input
    if (!userId || !unfollowUserId) {
      return res.status(400).json({ error: 'Both userId and unfollowUserId are required.' });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    const unfollowUser = await User.findById(unfollowUserId);

    if (!user || !unfollowUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if already not following
    if (!user.following.includes(unfollowUserId)) {
      return res.status(400).json({ error: 'You are not following this user.' });
    }

    // Remove unfollowUserId from user's following list
    user.following = user.following.filter((id) => id.toString() !== unfollowUserId);
    await user.save();

    // Remove userId from unfollowUser's followers list
    unfollowUser.followers = unfollowUser.followers.filter((id) => id.toString() !== userId);
    await unfollowUser.save();

    res.status(200).json({ success: true, message: `You have unfollowed ${unfollowUser.name}.` });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'An error occurred while unfollowing the user.' });
  }
};

module.exports = { followUser, unfollowUser };

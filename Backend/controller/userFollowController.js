const User = require('../models/userSchema');
const { sendFollowNotification } = require('../controller/notificationController'); // Using the new notification function
let io; // Socket.io instance

/**
 * Initialize the socket instance.
 * @param {object} socketIo - The Socket.io instance.
 */
const initSocket = (socketIo) => {
  io = socketIo;
};

/**
 * Follow a user and send a follow notification.
 * A notification will be created and sent in real-time to the followed user.
 */
const followUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { followUserId } = req.body;

    if (!userId || !followUserId) {
      return res.status(400).json({ error: "Both userId and followUserId are required." });
    }

    const user = await User.findById(userId);
    const followUser = await User.findById(followUserId);

    if (!user || !followUser) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.following.includes(followUserId)) {
      return res.status(400).json({ error: "You are already following this user." });
    }

    user.following.push(followUserId);
    await user.save();

    followUser.followers.push(userId);
    await followUser.save();

    return res.status(200).json({ success: true, message: `You are now following ${followUser.name}.` });
  } catch (error) {
    console.error("Error following user:", error);
    return res.status(500).json({ error: error.message || "An error occurred while following the user." });
  }
};


/**
 * Unfollow a user.
 * No notification is sent when unfollowing.
 */
const unfollowUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unfollowUserId } = req.body;

    if (!userId || !unfollowUserId) {
      return res.status(400).json({ error: "Both userId and unfollowUserId are required." });
    }

    const user = await User.findById(userId);
    const unfollowUser = await User.findById(unfollowUserId);

    if (!user || !unfollowUser) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.following.includes(unfollowUserId)) {
      return res.status(400).json({ error: "You are not following this user." });
    }

    user.following = user.following.filter((id) => id.toString() !== unfollowUserId);
    await user.save();

    unfollowUser.followers = unfollowUser.followers.filter((id) => id.toString() !== userId);
    await unfollowUser.save();

    return res.status(200).json({ success: true, message: `You have unfollowed ${unfollowUser.name}.` });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return res.status(500).json({ error: error.message || "An error occurred while unfollowing the user." });
  }
};


/**
 * Get the list of followers for the logged-in user.
 */
const getFollowers = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get the user with both followers and following populated
    const user = await User.findById(userId)
      .populate('followers', 'name email profile_image')
      .populate('following', '_id'); // We only need IDs of following to check
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get array of IDs that the user is following
    const followingIds = user.following.map(f => f._id.toString());

    // Map through followers and check if user follows them back
    const followersWithStatus = user.followers.map(follower => ({
      _id: follower._id,
      name: follower.name,
      email: follower.email,
      profile_image: follower.profile_image,
      isFollowing: followingIds.includes(follower._id.toString()) // true if user follows them back
    }));

    return res.status(200).json({ success: true, followers: followersWithStatus });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ error: 'An error occurred while fetching followers.' });
  }
};

/**
 * Get the list of users the logged-in user is following.
 */
const getFollowing = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'following',
      select: 'name email profile_image followers'
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Map through following users and add isFollowing field
    const followingWithStatus = user.following.map(followedUser => {
      const isFollowing = followedUser.followers.includes(userId);
      return {
        _id: followedUser._id,
        name: followedUser.name,
        email: followedUser.email,
        profile_image: followedUser.profile_image,
        isFollowing: isFollowing
      };
    });

    return res.status(200).json({ success: true, following: followingWithStatus });
  } catch (error) {
    console.error('Error fetching following list:', error);
    return res.status(500).json({ error: 'An error occurred while fetching following list.' });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  initSocket,
  getFollowers,
  getFollowing,
};

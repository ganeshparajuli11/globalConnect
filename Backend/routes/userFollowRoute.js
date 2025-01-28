const express = require('express');
const { followUser, unfollowUser } = require('../controller/userFollowController');


const router = express.Router();

// Route to follow a user
router.post('/follow', followUser);

// Route to unfollow a user
router.post('/unfollow', unfollowUser);

module.exports = router;

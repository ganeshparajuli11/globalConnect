const express = require('express');
const { followUser, unfollowUser, getFollowing, getFollowers } = require('../controller/userFollowController');
const { checkIsUser, checkAuthentication } = require('../middleware/middleware');


const router = express.Router();

// Route to follow a user
router.post('/follow',checkAuthentication, checkIsUser, followUser);

// Route to unfollow a user
router.post('/unfollow',checkAuthentication, checkIsUser, unfollowUser);
router.get('/following',checkAuthentication, checkIsUser, getFollowing);
router.get('/followers',checkAuthentication, checkIsUser, getFollowers);



module.exports = router;

const express = require('express');
const { checkAuthentication, checkIsUser, bothUser } = require('../middleware/middleware');
const { getUserProfile, sendOTP, verifyOTP, resetPassword, changePassword, updateProfileImage, getFollowCounts, getUserProfileById, getFollowingOrFollowers } = require('../controller/userSelfController');
const { uploadProfileImage } = require('../middleware/uploadMiddleware');
const router = express.Router();


// Route to get user details based on the token
router.get('/getUserProfile',checkAuthentication,checkIsUser,getUserProfile);

router.post('/forgot-password', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/change-password',checkAuthentication,bothUser, changePassword);
router.post(
    "/update-profile",
    checkAuthentication,
    bothUser,
    uploadProfileImage.single("profileImage"), 
    updateProfileImage
  );

// Route to get follower and following counts
router.get('/follow-counts', checkAuthentication, getFollowCounts);
router.get('/user-data-admin/:userId', checkAuthentication, getUserProfileById);
router.get('/user-connections', checkAuthentication, getFollowingOrFollowers);







module.exports = router;

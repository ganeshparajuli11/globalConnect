const express = require('express');
const { checkAuthentication, checkIsUser, bothUser, checkDOBUpdated } = require('../middleware/middleware');
const { getUserProfile, sendOTP, verifyOTP, resetPassword, changePassword, updateProfileImage, getFollowCounts, getUserProfileById, getFollowingOrFollowers, sendProfileUpdateOTP, updateUserProfile, blockUnblockUser, getBlockedUsers, searchUser, getUserProfileForMobile, getSelfProfileForMobile, updateDOB, initiateAccountDeletion, deactivateAccount } = require('../controller/userSelfController');
const { uploadProfileImage } = require('../middleware/uploadMiddleware');
const router = express.Router();


// Route to get user details based on the token
router.get('/getUserProfile',checkAuthentication,checkIsUser,getUserProfile);
router.get('/getMyProfile',checkAuthentication,checkIsUser,  getSelfProfileForMobile);


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
router.post('/update-email',checkAuthentication,bothUser, sendProfileUpdateOTP);
router.post('/update',checkAuthentication,bothUser, updateUserProfile);



// Route to get follower and following counts
router.get('/follow-counts', checkAuthentication, checkIsUser, getFollowCounts);
router.put('/block-unblock', checkAuthentication,checkIsUser, blockUnblockUser);
router.get('/get-blocked', checkAuthentication,checkIsUser, getBlockedUsers);
router.get('/search', checkAuthentication,checkIsUser, searchUser);
router.post('/deleteAccount', checkAuthentication,checkIsUser,initiateAccountDeletion);
router.post('/deactivate', checkAuthentication,checkIsUser,deactivateAccount);





router.put("/update-dob", checkAuthentication, updateDOB);
// Endpoint to check if DOB is updated
router.get("/check-dob", checkAuthentication, checkDOBUpdated, (req, res) => {
  res.status(200).json({ dobUpdated: req.dobUpdated });
});

router.get('/user-data-admin/:userId', checkAuthentication, getUserProfileById);
router.get('/user-data-user/:userId', checkAuthentication,checkIsUser,getUserProfileForMobile );

router.get('/user-connections', checkAuthentication, getFollowingOrFollowers);







module.exports = router;

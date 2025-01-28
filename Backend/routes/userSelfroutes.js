const express = require('express');
const { checkAuthentication, checkIsUser, bothUser } = require('../middleware/middleware');
const { getUserProfile, sendOTP, verifyOTP, resetPassword, changePassword, updateProfileImage } = require('../controller/userSelfController');
const uploadImage = require('../middleware/fileUploadMiddleware');
const router = express.Router();


// Route to get user details based on the token
router.get('/getUserProfile',checkAuthentication,checkIsUser,getUserProfile);

router.post('/forgot-password', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/change-password',checkAuthentication,bothUser, changePassword);
router.post('/update-profile',checkAuthentication,bothUser, uploadImage, updateProfileImage);





module.exports = router;

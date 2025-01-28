const express = require('express');
const { getUserDetails } = require('../controller/adminSelfController');
const { checkAuthentication, checkIsAdmin, checkIsUser } = require('../middleware/middleware');
const router = express.Router();


// Route to get user details based on the token
router.get('/getUserinfo',checkAuthentication,checkIsAdmin,getUserDetails);
// Route to get user details based on the token
router.get('/getUserData',checkAuthentication,checkIsUser,getUserDetails);

module.exports = router;

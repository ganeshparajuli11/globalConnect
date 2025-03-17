// routes/pushToken.js
const express = require('express');
const { checkAuthentication } = require('../middleware/middleware');
const { updateUserPushToken } = require('../controller/pushTokenController');
const router = express.Router();


router.post('/register',checkAuthentication, updateUserPushToken);

module.exports = router;

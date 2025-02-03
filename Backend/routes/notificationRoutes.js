const express = require('express');
const router = express.Router();
const { sendNotification, getUserNotifications, markNotificationAsRead } = require('../controller/notificationController');
const { sendRealTimeNotification } = require('../controller/socketController');
const { checkAuthentication, checkIsUser } = require('../middleware/middleware');

// Route to send notifications
router.post('/send',checkAuthentication,checkIsUser, sendNotification);
router.get('/get',checkAuthentication,checkIsUser,getUserNotifications);
router.get('/read',checkAuthentication,checkIsUser,markNotificationAsRead);



module.exports = router;

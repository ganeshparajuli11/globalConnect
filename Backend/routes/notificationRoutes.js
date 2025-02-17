const express = require('express');
const router = express.Router();

const { 
  sendNotificationToUser, 
  sendGlobalNotification, 
  getUserNotifications, 
  getGlobalNotifications, 
  markNotificationAsRead 
} = require('../controller/notificationController');

const { checkAuthentication, checkIsUser } = require('../middleware/middleware');

// =============================
// User Notification Routes
// =============================


router.get('/user', checkAuthentication, checkIsUser, getUserNotifications);


router.put('/user/:notificationId/read', checkAuthentication, checkIsUser, markNotificationAsRead);

// =============================
// Admin Notification Routes
// =============================


router.post('/admin/send/user', checkAuthentication, sendNotificationToUser);


router.post('/admin/send/global', checkAuthentication, sendGlobalNotification);


router.get('/admin/global', checkAuthentication, getGlobalNotifications);

module.exports = router;

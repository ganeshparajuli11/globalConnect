const express = require('express');
const router = express.Router();

const { 
  sendNotificationToUser, 
  sendGlobalNotification, 
  getUserNotifications, 
  getGlobalNotifications, 
  markNotificationAsRead,
  clearAllNotifications,
  getAdminNotifications
} = require('../controller/notificationController');

const { checkAuthentication, checkIsUser } = require('../middleware/middleware');

// =============================
// User Notification Routes
// =============================


router.get('/user', checkAuthentication, checkIsUser, getUserNotifications);


router.put('/user/:notificationId/read', checkAuthentication, checkIsUser, markNotificationAsRead);

// Clear all notifications for a user
router.delete('/user/clear-all', checkAuthentication, checkIsUser, clearAllNotifications);


// =============================
// Admin Notification Routes
// =============================


router.post('/admin/send/user', checkAuthentication, sendNotificationToUser);


router.post('/admin/send/global', checkAuthentication, sendGlobalNotification);


router.get('/admin/global', checkAuthentication, getGlobalNotifications);

// router to get all admin notifications
router.get('/admin', checkAuthentication, getAdminNotifications);

module.exports = router;

const express = require('express');
const router = express.Router();

const { 
  getUserNotifications, 

  markNotificationAsRead,
  clearAllNotifications,
  sendNotification
} = require('../controller/notificationController');

const { checkAuthentication, checkIsUser } = require('../middleware/middleware');
const { sendAdminNotification, getGlobalNotifications, scheduleAdminNotification, resendAdminNotification } = require('../controller/adminNotificationController');

// =============================
// User Notification Routes
// =============================


router.get('/user', checkAuthentication, checkIsUser, getUserNotifications);


router.put('/user/notification/read', checkAuthentication, checkIsUser, markNotificationAsRead);

// Clear all notifications for a user
router.delete('/user/clear-all', checkAuthentication, checkIsUser, clearAllNotifications);




// =============================
// Admin Notification Routes
// =============================



router.post('/admin/send/global', checkAuthentication, sendAdminNotification);
router.post('/admin/schedule', checkAuthentication, scheduleAdminNotification);


// // router to get all admin notifications
router.get('/admin/all', checkAuthentication, getGlobalNotifications);
router.post('/admin/resend/:notificationId', checkAuthentication, resendAdminNotification);


module.exports = router;

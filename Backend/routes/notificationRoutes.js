const express = require('express');
const router = express.Router();
const { sendNotification, getUserNotifications, markNotificationAsRead } = require('../controller/notificationController');
const { sendRealTimeNotification } = require('../controller/socketController');
const { checkAuthentication, checkIsUser } = require('../middleware/middleware');
const { createNotification, getNotifications, updateNotification, deleteNotification } = require('../controller/adminNotification');

// Route to send notifications
router.post('/send',checkAuthentication,checkIsUser, sendNotification);
router.get('/get',checkAuthentication,checkIsUser,getUserNotifications);
router.get('/read',checkAuthentication,checkIsUser,markNotificationAsRead);



// Create a new notification
router.post("/admin/send", createNotification);

// Get all notifications
router.get("/admin/get", getNotifications);

// Update a notification
router.put("/:id", updateNotification);

// Delete a notification
router.delete("/:id", deleteNotification);

module.exports = router;

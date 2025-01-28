const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controller/notificationController');
const { sendRealTimeNotification } = require('../controller/shocketController');

// Route to send notifications
router.post('/send',sendNotification);

module.exports = router;

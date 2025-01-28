const express = require('express');
const { sendMessage, getMessages, getAllMessages } = require('../controller/userMessaging');
const { checkAuthentication } = require('../middleware/middleware');

const router = express.Router();

router.post('/message',checkAuthentication, sendMessage);
router.post('/get-message',checkAuthentication, getMessages);
router.get('/all-message',checkAuthentication, getAllMessages);



module.exports = router;

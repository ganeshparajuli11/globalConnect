const express = require('express');
const { sendMessage, getMessages, getAllMessages } = require('../controller/userMessaging');
const { checkAuthentication } = require('../middleware/middleware');
const { uploadPostMedia } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post(
    '/message',
    checkAuthentication,
    uploadPostMedia.array("media", 1), 
    (req, res, next) => {
      // Attach the file URL to content if message type is image
      if (req.files && req.files.length > 0) {
        req.body.content = `/uploads/${req.files[0].filename}`; 
      }
      next();
    },
    sendMessage
  );
router.post('/get-message',checkAuthentication, getMessages);
router.get('/all-message',checkAuthentication, getAllMessages);



module.exports = router;

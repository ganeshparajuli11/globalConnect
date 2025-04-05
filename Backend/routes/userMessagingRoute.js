const express = require("express");

const { checkAuthentication } = require("../middleware/middleware");
const { uploadMessageMedia } = require("../middleware/uploadMiddleware");
const { getMessages, markMessageAsRead, sendMessage, getAllMessages, getMessagesForAdmin } = require("../controller/userMessaging");

module.exports = (io) => {
  const router = express.Router();

  router.post(
    "/message",
    checkAuthentication,
    uploadMessageMedia.array("media", 5), 
    (req, res) => sendMessage(req, res, io) 
  );

  router.post("/get-message", checkAuthentication, getMessages);
  router.post("/admin/get-message", checkAuthentication, getMessagesForAdmin); 

  router.get("/all-message", checkAuthentication, getAllMessages);

  router.post("/mark-as-read", checkAuthentication, markMessageAsRead);

  return router;
};

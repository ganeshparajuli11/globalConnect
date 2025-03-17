const express = require("express");

const { checkAuthentication } = require("../middleware/middleware");
const { uploadMessageMedia } = require("../middleware/uploadMiddleware");
const { getMessages, markMessageAsRead, sendMessage, getAllMessages, getMessagesForAdmin } = require("../controller/userMessaging");

module.exports = (io) => {
  const router = express.Router();

  router.post(
    "/message",
    checkAuthentication,
    uploadMessageMedia.array("media", 5), // Handle multiple media files
    (req, res) => sendMessage(req, res, io) // Pass io for real-time updates
  );

  router.post("/get-message", checkAuthentication, getMessages); //Corrected this to POST because we are sending data from frontend
  router.post("/admin/get-message", checkAuthentication, getMessagesForAdmin); //Corrected this to POST because we are sending data from frontend

  router.get("/all-message", checkAuthentication, getAllMessages);

  router.post("/mark-as-read", checkAuthentication, markMessageAsRead);

  return router;
};

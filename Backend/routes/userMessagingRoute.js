const express = require("express");
const { 
  sendMessage, 
  getMessages, 
  getAllMessages, 
  adminGetMessages, 
  adminGetAllMessages, 
  adminSendMessage 
} = require("../controller/userMessaging");
const { checkAuthentication } = require("../middleware/middleware");
const { uploadPostMedia, uploadMessageMedia } = require("../middleware/uploadMiddleware");


module.exports = (io) => {
  const router = express.Router();

  router.post(
    "/message",
    checkAuthentication,
    uploadMessageMedia.array("media", 1), // Use the new middleware
    (req, res, next) => next(),
    (req, res) => sendMessage(req, res, io)
  );

  router.post("/get-message", checkAuthentication, getMessages);
  router.get("/all-message", checkAuthentication, getAllMessages);

  // ----- Admin Messaging Routes -----
  router.post(
    "admin/message",
    checkAuthentication,
    uploadMessageMedia.array("media", 1), // Use the new middleware
    (req, res, next) => next(),
    (req, res) => adminSendMessage(req, res, io)
  );

  router.post("/admin/get-message", checkAuthentication, adminGetMessages);
  router.get("/admin/all-message", checkAuthentication, adminGetAllMessages);

  return router;
};

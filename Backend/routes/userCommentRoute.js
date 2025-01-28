const express = require("express");
const router = express.Router();
const { checkAuthentication, bothUser, checkIsUser } = require("../middleware/middleware");
const { getCommentsByPost, addComment } = require("../controller/userCommentController");



// Route to create a post
router.post("/create", checkAuthentication, checkIsUser,addComment);
// router.get("/all/:postId", checkAuthentication, bothUser,getCommentsByPost);
router.get("/all/:postId",getCommentsByPost);


module.exports = router;

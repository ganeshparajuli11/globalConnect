const express = require("express");
const router = express.Router();
const { checkAuthentication, checkIsUser } = require("../middleware/middleware");
const { createPost, getAllPost } = require("../controller/userPostController");


// Route to create a post
router.post("/create", checkAuthentication, checkIsUser,createPost);
// router.get("/all", checkAuthentication, checkIsUser,getAllPost);
router.get("/all",getAllPost);


module.exports = router;

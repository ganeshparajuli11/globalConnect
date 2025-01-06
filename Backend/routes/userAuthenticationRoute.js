const express = require("express");
const { signup, login } = require("../controller/userAuthenticationController"); // Import only once
const router = express.Router();

// Define routes for signup and login
router.post("/signup", signup);
router.post("/login", login);

module.exports = router;

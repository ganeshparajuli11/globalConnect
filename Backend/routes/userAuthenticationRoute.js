const express = require("express");
const { signup, login, loginAdmin, updateDestinationCountry } = require("../controller/userAuthenticationController"); // Import only once
const { checkAuthentication, checkIsAdmin, checkIsUser } = require("../middleware/middleware");

const router = express.Router();

// Define routes for signup and login
router.post("/signup", signup);
router.post("/login", login);
router.post("/loginAdmin", loginAdmin);
router.put("/update-destination", checkAuthentication, checkIsUser, updateDestinationCountry);
module.exports = router;


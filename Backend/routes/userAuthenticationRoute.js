const express = require("express");
const { signup, login, loginAdmin, updateDestinationCountry, adminSignup } = require("../controller/userAuthenticationController"); // Import only once
const { checkAuthentication, checkIsAdmin, checkIsUser } = require("../middleware/middleware");
const { uploadProfileImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Define routes for signup and login
router.post("/signup", signup);
// Admin signup route with profile image upload
router.post("/admin/signup", uploadProfileImage.single("profile_image"), adminSignup);

router.post("/login", login);
router.post("/loginAdmin", loginAdmin);
router.put("/update-destination", checkAuthentication, checkIsUser, updateDestinationCountry);
module.exports = router;


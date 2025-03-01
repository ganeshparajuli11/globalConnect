const express = require("express");
const {
  checkAuthentication,
  checkIsAdmin,
  checkIsUser,
} = require("../middleware/middleware");
const { uploadProfileImage } = require("../middleware/uploadMiddleware");
const { signup, getAllAdmins, adminSignup, loginAdmin, login, updateDestinationCountry, removeAdmin, editAdminDetails } = require("../controller/userAuthenticationController");

const router = express.Router();

// Define routes for signup and login
router.post("/signup", signup);

router.get("/allAdmin", getAllAdmins);
router.delete("/admin/remove/:adminId",checkAuthentication, removeAdmin);
router.put("/admin/edit/:adminId",uploadProfileImage.single("profile_image"),checkAuthentication,  editAdminDetails);




// Admin signup route with profile image upload
router.post(
  "/admin/signup",
  uploadProfileImage.single("profile_image"),
  adminSignup
);

router.post("/login", login);
router.post("/loginAdmin", loginAdmin);
router.put(
  "/update-destination",
  checkAuthentication,
  checkIsUser,
  updateDestinationCountry
);
module.exports = router;

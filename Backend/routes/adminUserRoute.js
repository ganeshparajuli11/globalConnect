const express = require("express");
const {
  getUserDashboard,
  getUserStats,
  getActiveUsers,
  getInactiveUsers,
  getAllUsers,
  getBlockedUsers,
  getReportedUsers,
  updateLocation,

  updateUserActivity,
  manageUserStatus,
  removeSuspensionOrBlock,
  sendEmailToUsers,
  searchUsers,
  resetReportCount,
  getUnverifiedUsers,
  getVerifiedUsers,
  verifyUser,
  unverifyUser,
} = require("../controller/adminUserController");
const {
  checkAuthentication,
  checkIsAdmin,
  checkIsUser,
} = require("../middleware/middleware");
const router = express.Router();

// Define routes for signup and login
router.get("/all", checkAuthentication, checkIsAdmin, getAllUsers);
router.get(
  "/get-reported-user",
  checkAuthentication,
  checkIsAdmin,
  getUserDashboard
);
router.get(
  "/get-active-user",
  checkAuthentication,
  checkIsAdmin,
  getActiveUsers
);
router.get(
  "/get-in-active-user",
  checkAuthentication,
  checkIsAdmin,
  getInactiveUsers
);
router.get(
  "/get-blocked-user",
  checkAuthentication,
  checkIsAdmin,
  getBlockedUsers
);
router.get(
  "/get-all-reported-user",
  checkAuthentication,
  checkIsAdmin,
  getReportedUsers
);
router.put("/update-location", checkAuthentication, checkIsUser, updateLocation);

router.put(
  "/update-status",
  checkAuthentication,
  checkIsUser,
  updateUserActivity
);


router.put(
  "/admin-update-user-status",
  checkAuthentication,
  checkIsAdmin,
  manageUserStatus
);
router.put(
    "/admin-remove-user-status",
    checkAuthentication,
    checkIsAdmin,
    removeSuspensionOrBlock
  );
  

router.get("/userStats", checkAuthentication, getUserStats);

router.post("/send-email-to-users", checkAuthentication, checkIsAdmin, sendEmailToUsers);
// In adminRoutes.js or similar
router.get('/unverified-users', checkAuthentication,checkIsAdmin, getUnverifiedUsers);
router.get('/verified-users', checkAuthentication,checkIsAdmin, getVerifiedUsers);
router.put('/verify-user/:userId', checkAuthentication,checkIsAdmin, verifyUser);
router.put('/unverify-user/:userId', checkAuthentication,checkIsAdmin, unverifyUser);


// search users by name or email
router.get("/search-users", checkAuthentication, checkIsAdmin, searchUsers);
router.put("/reset-report-count", checkAuthentication, checkIsAdmin, resetReportCount );

module.exports = router;

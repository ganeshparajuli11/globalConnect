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
  updateReachedDestination,
  updateUserActivity,
  manageUserStatus,
  removeSuspensionOrBlock,
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
router.post("/get-location", checkAuthentication, checkIsUser, updateLocation);
router.put(
  "/reached",
  checkAuthentication,
  checkIsUser,
  updateReachedDestination
);
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

module.exports = router;

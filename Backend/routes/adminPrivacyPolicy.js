const express = require("express");
const { getPrivacyPolicy, createOrUpdatePrivacyPolicy, deletePrivacyPolicy, getTermsConditions, createOrUpdateTermsConditions, deleteTermsConditions } = require("../controller/adminPrivacyPolicy");
const router = express.Router();


// Privacy Policy Routes
router.get("/privacy-policy", getPrivacyPolicy);
router.post("/privacy-policy", createOrUpdatePrivacyPolicy);
router.delete("/privacy-policy", deletePrivacyPolicy);

// Terms & Conditions Routes
router.get("/terms-conditions", getTermsConditions);
router.post("/terms-conditions", createOrUpdateTermsConditions);
router.delete("/terms-conditions", deleteTermsConditions);

module.exports = router;

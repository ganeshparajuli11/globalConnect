const express = require('express');
const { checkIsUser, checkAuthentication } = require('../middleware/middleware');
const { reportUser } = require('../controller/userReportController');
const router = express.Router();
// Route to create a new report category
router.post('/create',checkAuthentication,checkIsUser , reportUser)

module.exports = router;

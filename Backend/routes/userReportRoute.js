const express = require('express');
const { checkIsUser, checkAuthentication } = require('../middleware/middleware');
const { reportUser, reportPost } = require('../controller/userReportController');
const router = express.Router();
// Route to create a new report category
router.post('/create',checkAuthentication,checkIsUser , reportUser)
router.post('/post/create',checkAuthentication,checkIsUser , reportPost)


module.exports = router;

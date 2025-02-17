const express = require('express');
const { getUserDetails } = require('../controller/adminSelfController');
const { checkAuthentication, checkIsAdmin, checkIsUser } = require('../middleware/middleware');
const { 
  createReportCategory, 
  editReportCategory, 
  deleteReportCategory, 
  getReportCategoryById, 
  getAllReportCategories 
} = require('../controller/reportCategoryController');
const router = express.Router();

// Route to get user details based on the token (Admin)
router.get('/getUserinfo', checkAuthentication, checkIsAdmin, getUserDetails);

// Route to get user details based on the token (User)
router.get('/getUserData', checkAuthentication, checkIsUser, getUserDetails);

// Controlling the reportCategory

// Route to create a new report category (Admin only)
router.post('/create', checkAuthentication, checkIsAdmin, createReportCategory);

// Route to edit an existing report category (Admin only)
router.put('/edit/:id', checkAuthentication, checkIsAdmin, editReportCategory);

// Route to delete a report category (Admin only)
router.delete('/delete/:id', checkAuthentication, checkIsAdmin, deleteReportCategory);

// Route to get a specific report category by ID (Admin and User)
router.get('/:id', checkAuthentication, getReportCategoryById);

// Route to get all report categories (Admin and User)
router.get('/', checkAuthentication, getAllReportCategories);

module.exports = router;

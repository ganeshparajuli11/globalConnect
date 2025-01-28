const express = require('express');
const router = express.Router();
const { createCategory, getAllCategories } = require('../controller/adminCategoryController');
const { checkAuthentication, checkIsAdmin, bothUser } = require('../middleware/middleware');

// Route to create a new category
router.post('/create', checkAuthentication, checkIsAdmin, createCategory);
// router.get('/all', checkAuthentication, bothUser, getAllCategories);
router.get('/all',getAllCategories);


module.exports = router;

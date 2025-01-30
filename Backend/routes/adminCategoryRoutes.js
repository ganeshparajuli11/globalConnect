const express = require('express');
const router = express.Router();
const { createCategory, getAllCategories, toggleCategoryStatus, deleteCategory, getAllCategoriesUser } = require('../controller/adminCategoryController');
const { checkAuthentication, checkIsAdmin, bothUser } = require('../middleware/middleware');

// Route to create a new category
router.post('/create', checkAuthentication, checkIsAdmin, createCategory);
// router.get('/all', checkAuthentication, bothUser, getAllCategories);
router.get('/all-admin',getAllCategories);
router.get('/all',getAllCategoriesUser);

router.patch('/status/:categoryId',toggleCategoryStatus);
router.delete('/delete/:categoryId',deleteCategory);




module.exports = router;

const express    = require('express');
const router     = express.Router();
const upload     = require('../middleware/uploadMiddleware.js');
const { protect, isAdmin } = require('../middleware/authMiddleware.js');
const {
  addCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../Controllers/categoryController.js');

// Public
router.get('/',    getAllCategories);
router.get('/:id', getCategoryById);

// Admin only
router.post('/',    protect, isAdmin, upload, addCategory);
router.put('/:id',  protect, isAdmin, upload, updateCategory);
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;
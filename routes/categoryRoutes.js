const express    = require('express');
const router     = express.Router();
const upload     = require('../middleware/uploadMiddleware');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  addCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../Controllers/categoryController');

// Public
router.get('/',    getAllCategories);
router.get('/:id', getCategoryById);

// Admin only
router.post('/',    protect, isAdmin, upload, addCategory);
router.put('/:id',  protect, isAdmin, upload, updateCategory);
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;
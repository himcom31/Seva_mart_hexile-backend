const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deactivateCategory,
  deleteCategory,
} = require('../Controllers/Vendorcategorycontroller.js');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/',              getAllCategories);   // GET  /api/vendor-categories
router.get('/slug/:slug',    getCategoryBySlug); // GET  /api/vendor-categories/slug/plumbing
router.get('/:id',           getCategoryById);   // GET  /api/vendor-categories/1

// ─── Admin/Protected Routes ───────────────────────────────────────────────────
router.post('/',             createCategory);    // POST   /api/vendor-categories
router.put('/:id',           updateCategory);    // PUT    /api/vendor-categories/1
router.patch('/:id/deactivate', deactivateCategory); // PATCH  /api/vendor-categories/1/deactivate
router.delete('/:id',        deleteCategory);   // DELETE /api/vendor-categories/1

module.exports = router;
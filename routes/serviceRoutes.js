const express = require('express');
const router  = express.Router();
const upload  = require('../config/upload');           // ✅ multer middleware

const { protect, isAdmin } = require('../middleware/authMiddleware.js');
const {
  addService,
  getAllServices,
  getServicesByCategory,
  getServiceById,
  updateService,
  toggleStatus,
  updateVerifyStatus,
  deleteService,
} = require('../Controllers/serviceController.js');

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/',                         getAllServices);
router.get('/by-category/:category_id', getServicesByCategory);
router.get('/:id',                      getServiceById);

// ── Admin only ───────────────────────────────────────────────────────────────
router.post('/',      protect, isAdmin, upload.fields([
  { name: 'image', maxCount: 3 },
  { name: 'icon',  maxCount: 3 },
]), addService);

router.put('/:id',    protect, isAdmin, upload.fields([
  { name: 'image', maxCount: 3 },
  { name: 'icon',  maxCount: 3 },
]), updateService);

router.delete('/:id', protect, isAdmin, deleteService);

// ── Toggle / Verify ──────────────────────────────────────────────────────────
router.patch('/:id/toggle-status', protect, isAdmin, toggleStatus);
router.patch('/:id/verify',        protect, isAdmin, updateVerifyStatus);

module.exports = router;
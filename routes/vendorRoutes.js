// routes/vendorRoutes.js
const express        = require('express');
const router         = express.Router();
const upload         = require('../middleware/uploadVendorMiddleware.js');
const { protect, isAdmin }  = require('../middleware/authMiddleware.js');
const { protectVendor }     = require('../middleware/Vendorauthmiddleware.js');

const {
  // ── Auth ──────────────────────────────────────
  registerVendor,
  loginVendor,
  getMe,
  changePassword,
  logoutVendor,

  // ── Admin ─────────────────────────────────────
  getAllVendors,
  getVendorById,
  updateVendor,
  updateStatus,
  updateVerifyStatus,
  toggleAvailability,
  addVendorService,
  removeVendorService,
  getVendorServices,
  markAttendance,
  getAttendance,
  getPerformance,
  deleteVendor,
} = require('../Controllers/vendorController.js');


// ══════════════════════════════════════════════════════════════
//  PUBLIC  (no auth)
// ══════════════════════════════════════════════════════════════
router.post('/register', upload, registerVendor);   // vendor self-registration
router.post('/login',    loginVendor);               // vendor login → JWT


// ══════════════════════════════════════════════════════════════
//  VENDOR-PROTECTED  (vendor JWT required)
// ══════════════════════════════════════════════════════════════
router.get   ('/me',              protectVendor, getMe);           // own profile
router.patch ('/me/password',     protectVendor, changePassword);  // change password
router.post  ('/logout',          protectVendor, logoutVendor);    // logout hint


// ══════════════════════════════════════════════════════════════
//  ADMIN-ONLY  (admin JWT required)
// ══════════════════════════════════════════════════════════════
router.get   ('/',       protect, isAdmin, getAllVendors);
router.get   ('/:id',    protect, isAdmin, getVendorById);
router.put   ('/:id',    protect, isAdmin, upload, updateVendor);
router.delete('/:id',    protect, isAdmin, deleteVendor);

// Status & Verification
router.patch('/:id/status',       protect, isAdmin, updateStatus);
router.patch('/:id/verify',       protect, isAdmin, updateVerifyStatus);
router.patch('/:id/availability', protect, isAdmin, toggleAvailability);

// Services
router.get   ('/:id/services',             protect, isAdmin, getVendorServices);
router.post  ('/:id/services',             protect, isAdmin, addVendorService);
router.delete('/:id/services/:service_id', protect, isAdmin, removeVendorService);

// Attendance
router.post('/:id/attendance', protect, isAdmin, markAttendance);
router.get ('/:id/attendance', protect, isAdmin, getAttendance);

// Performance
router.get('/:id/performance', protect, isAdmin, getPerformance);


module.exports = router;
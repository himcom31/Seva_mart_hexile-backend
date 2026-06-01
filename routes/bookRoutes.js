const express = require('express');
const router  = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware.js');
const {
  createBooking,
  getAllBookings,
  getBookingStats,
  getBookingById,
  getBookingsByService,
  updateBookingStatus,
  updateBooking,
  assignVendor,
  deleteBooking,
  getMyBookings ,
} = require('../Controllers/BookController');
const { protectVendor } = require('../middleware/vendorAuthMiddleware');


// ── Public ────────────────────────────────────────────────────────────────────
// Anyone can create a booking
router.post('/', createBooking);
router.get('/my', protectVendor, getMyBookings);


// ── Admin only ────────────────────────────────────────────────────────────────
router.get('/stats',                  protect, isAdmin, getBookingStats);
router.get('/',                       protect, isAdmin, getAllBookings);
router.get('/service/:service_id',    protect, isAdmin, getBookingsByService);
router.get('/:id',                    protect, isAdmin, getBookingById);
router.put('/:id',                    protect, isAdmin, updateBooking);
router.patch('/:id/status',           protect, isAdmin, updateBookingStatus);
router.patch('/:id/assign-vendor',    protect, isAdmin, assignVendor);   // ← NEW
router.delete('/:id',                 protect, isAdmin, deleteBooking);




module.exports = router;
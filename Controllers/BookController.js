const Booking = require('../models/Book');
const Service = require('../models/Services/Service');

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

// ── Validate date is not in the past ─────────────────────────────────────────
const isValidFutureDate = (dateStr) => {
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(dateStr);
  selected.setHours(0, 0, 0, 0);
  return selected >= today;
};

// @desc   Create Booking
// @route  POST /api/bookings
// @access Public
exports.createBooking = (req, res) => {
  try {
    const {
      service_id, full_name, mobile, address,
      landmark, city, preferred_date, preferred_time, notes,
      selected_sub_services  // ← JSON string: '[{"id":1,"name":"AC Filter Clean"},...]'
    } = req.body;

    // ── Validations ──────────────────────────────────────────────────────────
    if (!service_id)      return res.status(400).json({ message: 'service_id is required' });
    if (!full_name)       return res.status(400).json({ message: 'full_name is required' });
    if (!mobile)          return res.status(400).json({ message: 'mobile is required' });
    if (!address)         return res.status(400).json({ message: 'address is required' });
    if (!preferred_date)  return res.status(400).json({ message: 'preferred_date is required' });
    if (!preferred_time)  return res.status(400).json({ message: 'preferred_time is required' });

    if (!isValidFutureDate(preferred_date)) {
      return res.status(400).json({ message: 'preferred_date cannot be in the past' });
    }

    // ── Validate selected_sub_services JSON if provided ───────────────────────
    let parsedSubServices = null;
    if (selected_sub_services) {
      try {
        const arr = typeof selected_sub_services === 'string'
          ? JSON.parse(selected_sub_services)
          : selected_sub_services;
        if (Array.isArray(arr) && arr.length > 0) {
          parsedSubServices = JSON.stringify(arr);
        }
      } catch {
        return res.status(400).json({ message: 'selected_sub_services must be valid JSON' });
      }
    }

    // ── Fetch service details ─────────────────────────────────────────────────
    const service = Service.findById(service_id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const booking = Booking.create({
      service_id,
      service_name:         service.name,
      category_name:        service.category_name || null,
      service_code:         service.code,
      full_name,
      mobile,
      address,
      landmark:             landmark || null,
      city:                 city || 'Patna',
      preferred_date,
      preferred_time,
      notes:                notes || null,
      selected_sub_services: parsedSubServices   // ← stored as JSON string
    });

    res.status(201).json({ success: true, message: 'Booking created successfully', booking });
  } catch (err) {
    console.error('Create Booking Error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get All Bookings (Admin)
// @route  GET /api/bookings
// @access Private (Admin)
exports.getAllBookings = (req, res) => {
  try {
    const { status } = req.query;
    const bookings = status ? Booking.findByStatus(status) : Booking.findAll();

    // Parse selected_sub_services JSON string → array for each booking
    const enriched = bookings.map(b => ({
      ...b,
      selected_sub_services: b.selected_sub_services
        ? (() => { try { return JSON.parse(b.selected_sub_services); } catch { return []; } })()
        : []
    }));

    res.status(200).json({ success: true, count: enriched.length, bookings: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get Booking Stats (Admin)
// @route  GET /api/bookings/stats
// @access Private (Admin)
exports.getBookingStats = (req, res) => {
  try {
    const stats = Booking.getStats();
    res.status(200).json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get Single Booking
// @route  GET /api/bookings/:id
// @access Private (Admin)
exports.getBookingById = (req, res) => {
  try {
    const booking = Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Parse sub-services for convenience
    booking.selected_sub_services = booking.selected_sub_services
      ? (() => { try { return JSON.parse(booking.selected_sub_services); } catch { return []; } })()
      : [];

    res.status(200).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get Bookings by Service (Admin)
// @route  GET /api/bookings/service/:service_id
// @access Private (Admin)
exports.getBookingsByService = (req, res) => {
  try {
    const bookings = Booking.findByServiceId(req.params.service_id).map(b => ({
      ...b,
      selected_sub_services: b.selected_sub_services
        ? (() => { try { return JSON.parse(b.selected_sub_services); } catch { return []; } })()
        : []
    }));
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Update Booking Status (Admin)
// @route  PATCH /api/bookings/:id/status
// @access Private (Admin)
exports.updateBookingStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const booking = Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const updated = Booking.updateStatus(req.params.id, status);
    res.status(200).json({ success: true, message: `Booking status updated to ${status}`, booking: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Update Booking Details (Admin)
// @route  PUT /api/bookings/:id
// @access Private (Admin)
exports.updateBooking = (req, res) => {
  try {
    const booking = Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const {
      full_name, mobile, address, landmark, city,
      preferred_date, preferred_time, notes, status,
      vendor_id, vendor_name,
      selected_sub_services
    } = req.body;

    if (preferred_date && !isValidFutureDate(preferred_date)) {
      return res.status(400).json({ message: 'preferred_date cannot be in the past' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const fields = {};
    if (full_name)               fields.full_name       = full_name;
    if (mobile)                  fields.mobile          = mobile;
    if (address)                 fields.address         = address;
    if (landmark !== undefined)  fields.landmark        = landmark;
    if (city)                    fields.city            = city;
    if (preferred_date)          fields.preferred_date  = preferred_date;
    if (preferred_time)          fields.preferred_time  = preferred_time;
    if (notes !== undefined)     fields.notes           = notes;
    if (status)                  fields.status          = status;
    if (vendor_id !== undefined) fields.vendor_id       = vendor_id;
    if (vendor_name !== undefined) fields.vendor_name   = vendor_name;
    if (selected_sub_services !== undefined) {
      fields.selected_sub_services = selected_sub_services
        ? JSON.stringify(
            typeof selected_sub_services === 'string'
              ? JSON.parse(selected_sub_services)
              : selected_sub_services
          )
        : null;
    }

    const updated = Booking.update(req.params.id, fields);
    res.status(200).json({ success: true, message: 'Booking updated', booking: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Assign Vendor to Booking (Admin)
// @route  PATCH /api/bookings/:id/assign-vendor
// @access Private (Admin)
exports.assignVendor = (req, res) => {
  try {
    const { vendor_id, vendor_name } = req.body;
    if (!vendor_id || !vendor_name) {
      return res.status(400).json({ message: 'vendor_id and vendor_name are required' });
    }

    const booking = Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const updated = Booking.update(req.params.id, { vendor_id, vendor_name });
    res.status(200).json({ success: true, message: 'Vendor assigned to booking', booking: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Delete Booking (Admin)
// @route  DELETE /api/bookings/:id
// @access Private (Admin)
exports.deleteBooking = (req, res) => {
  try {
    const booking = Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    Booking.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


exports.getMyBookings = (req, res) => {
  try {
    const vendor_id = req.vendor.id;   // set by protectVendor middleware
    const bookings  = Booking.findByVendorId(vendor_id);
 
    const enriched = bookings.map(b => ({
      ...b,
      selected_sub_services: b.selected_sub_services
        ? (() => { try { return JSON.parse(b.selected_sub_services); } catch { return []; } })()
        : []
    }));
 
    res.status(200).json({ success: true, count: enriched.length, bookings: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
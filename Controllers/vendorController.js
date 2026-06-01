// Controllers/vendorController.js
const Vendor = require('../models/Vendor');
const jwt    = require('jsonwebtoken');
const path   = require('path');
const fs     = require('fs');

// ── Token helper ─────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id, role: 'vendor' }, process.env.JWT_SECRET, {
    expiresIn: process.env.VENDOR_JWT_EXPIRES || '7d',
  });


// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH  (Public routes)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/vendors/register
exports.registerVendor = (req, res) => {
  try {
    const {
      name, mobile, aadhaar, email, password, confirm_password,
      experience, category_id, subcategory_id,
      city, address, vendor_type, notes,
    } = req.body;

    // ── Required field checks ──────────────────────────────────────────────
    if (!name)     return res.status(400).json({ success: false, message: 'Name is required' });
    if (!mobile)   return res.status(400).json({ success: false, message: 'Mobile is required' });
    if (!aadhaar)  return res.status(400).json({ success: false, message: 'Aadhaar is required' });
    if (!city)     return res.status(400).json({ success: false, message: 'City is required' });
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });

    // ── Password rules ─────────────────────────────────────────────────────
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    if (!/\d/.test(password))
      return res.status(400).json({ success: false, message: 'Password must contain at least one number' });
    if (confirm_password && password !== confirm_password)
      return res.status(400).json({ success: false, message: 'Passwords do not match' });

    // ── Duplicate checks ───────────────────────────────────────────────────
    if (Vendor.findByMobileRaw(mobile))
      return res.status(409).json({ success: false, message: 'Mobile already registered' });
    if (Vendor.findByAadhaar(aadhaar))
      return res.status(409).json({ success: false, message: 'Aadhaar already registered' });
    if (email && Vendor.findByEmailRaw(email))
      return res.status(409).json({ success: false, message: 'Email already registered' });

    // ── File uploads ───────────────────────────────────────────────────────
    const profile_photo = req.files?.profile_photo?.[0]?.filename || null;
    const aadhaar_front = req.files?.aadhaar_front?.[0]?.filename || null;
    const aadhaar_back  = req.files?.aadhaar_back?.[0]?.filename  || null;
    const certificate   = req.files?.certificate?.[0]?.filename   || null;

    // ── Create vendor (model hashes password) ──────────────────────────────
    const vendor = Vendor.create({
      name, mobile, aadhaar, email, password,
      experience, category_id, subcategory_id,
      city, address, profile_photo, aadhaar_front,
      aadhaar_back, certificate, vendor_type, notes,
    });

    const token = generateToken(vendor.id);

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully. Pending verification.',
      token,
      vendor,
    });
  } catch (err) {
    console.error('Register Vendor Error:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};


// POST /api/vendors/login
exports.loginVendor = (req, res) => {
  try {
    const { mobile, email, password } = req.body;
 
    if (!password)
      return res.status(400).json({ success: false, message: 'Password is required' });
    if (!mobile && !email)
      return res.status(400).json({ success: false, message: 'Mobile or email is required' });
 
    // ── Mobile number normalizer ───────────────────────────────────────────
    // Tries multiple formats so login works regardless of how the frontend
    // sends the number, and regardless of how it was stored at registration.
    let vendorRaw = null;
 
    if (mobile) {
      const digits = mobile.replace(/\D/g, ""); // strip everything except digits
      // e.g. "+917563883929" → "917563883929" (12 digits)
      // e.g. "7563883929"    → "7563883929"   (10 digits)
 
      const attempts = [
        mobile,                    // exactly as sent:          +917563883929
        `+${digits}`,              // re-prefixed with +:        +917563883929
        `+91${digits.slice(-10)}`, // force +91 + last 10 digits: +917563883929
        digits.slice(-10),         // plain 10 digits:           7563883929
        `91${digits.slice(-10)}`,  // with country code no +:    917563883929
      ];
 
      console.log("Mobile login attempts:", attempts);
 
      for (const attempt of attempts) {
        vendorRaw = Vendor.findByMobileRaw(attempt);
        if (vendorRaw) {
          console.log("Mobile matched with format:", attempt);
          break;
        }
      }
    } else {
      vendorRaw = Vendor.findByEmailRaw(email);
    }
 
    // ── Not found ──────────────────────────────────────────────────────────
    if (!vendorRaw)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
 
    // ── No password set ────────────────────────────────────────────────────
    if (!vendorRaw.password)
      return res.status(401).json({
        success: false,
        message: 'No password set for this account. Contact support.',
      });
 
    // ── Wrong password ─────────────────────────────────────────────────────
    if (!Vendor.checkPassword(password, vendorRaw.password))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
 
    // ── Account status gate ────────────────────────────────────────────────
    if (vendorRaw.status === 'suspended')
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
    if (vendorRaw.status === 'inactive')
      return res.status(403).json({ success: false, message: 'Your account is inactive. Contact support.' });
 
    const token  = generateToken(vendorRaw.id);
    const vendor = Vendor._safe(vendorRaw);
 
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      vendor,
    });
  } catch (err) {
    console.error('Login Vendor Error:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};


// GET /api/vendors/me  (vendor must be logged in)
exports.getMe = (req, res) => {
  try {
    const vendor   = Vendor.findById(req.vendor.id);
    if (!vendor)
      return res.status(404).json({ success: false, message: 'Vendor not found' });

    const services   = Vendor.getServices(req.vendor.id);
    const attendance = Vendor.getAttendance(req.vendor.id);

    res.status(200).json({ success: true, vendor, services, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};


// PATCH /api/vendors/me/password  (vendor must be logged in)
exports.changePassword = (req, res) => {
  try {
    const { current_password, new_password, confirm_new_password } = req.body;

    if (!current_password || !new_password)
      return res.status(400).json({ success: false, message: 'current_password and new_password are required' });

    if (new_password.length < 8)
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });

    if (!/\d/.test(new_password))
      return res.status(400).json({ success: false, message: 'New password must contain at least one number' });

    if (confirm_new_password && new_password !== confirm_new_password)
      return res.status(400).json({ success: false, message: 'Passwords do not match' });

    const vendorRaw = Vendor.findByIdRaw(req.vendor.id);
    if (!vendorRaw)
      return res.status(404).json({ success: false, message: 'Vendor not found' });

    if (!Vendor.checkPassword(current_password, vendorRaw.password))
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    Vendor.updatePassword(req.vendor.id, new_password);

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};


// POST /api/vendors/logout  (stateless JWT — just a client hint)
exports.logoutVendor = (_req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};


// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN routes  (unchanged logic — kept here for single-file convenience)
// ═══════════════════════════════════════════════════════════════════════════════

exports.getAllVendors = (req, res) => {
  try {
    const { status, city, category_id, verify_status } = req.query;
    const vendors = Vendor.findAll({ status, city, category_id, verify_status });
    res.status(200).json({ success: true, count: vendors.length, vendors });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getVendorById = (req, res) => {
  try {
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const services   = Vendor.getServices(req.params.id);
    const attendance = Vendor.getAttendance(req.params.id);
    res.status(200).json({ success: true, vendor, services, attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.updateVendor = (req, res) => {
  try {
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const { name, email, experience, category_id, subcategory_id,
            city, address, vendor_type, notes } = req.body;

    const handleFile = (field) => {
      if (req.files?.[field]?.[0]) {
        if (vendor[field]) {
          const old = path.join(__dirname, '../uploads/vendors', vendor[field]);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }
        return req.files[field][0].filename;
      }
      return vendor[field];
    };

    const updated = Vendor.update(req.params.id, {
      name:           name           || vendor.name,
      email:          email          ?? vendor.email,
      experience:     experience     ?? vendor.experience,
      category_id:    category_id    ?? vendor.category_id,
      subcategory_id: subcategory_id ?? vendor.subcategory_id,
      city:           city           || vendor.city,
      address:        address        ?? vendor.address,
      vendor_type:    vendor_type    || vendor.vendor_type,
      notes:          notes          ?? vendor.notes,
      profile_photo:  handleFile('profile_photo'),
      aadhaar_front:  handleFile('aadhaar_front'),
      aadhaar_back:   handleFile('aadhaar_back'),
      certificate:    handleFile('certificate'),
    });

    res.status(200).json({ success: true, message: 'Vendor updated', vendor: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.updateStatus = (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'inactive', 'suspended', 'pending'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const updated = Vendor.updateStatus(req.params.id, status);
    res.status(200).json({ success: true, message: `Vendor status set to ${status}`, vendor: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.updateVerifyStatus = (req, res) => {
  try {
    const { verify_status } = req.body;
    const allowed = ['pending', 'verified', 'rejected'];
    if (!allowed.includes(verify_status))
      return res.status(400).json({ message: `verify_status must be: ${allowed.join(', ')}` });
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const updated = Vendor.updateVerifyStatus(req.params.id, verify_status);
    res.status(200).json({ success: true, message: `Verify status: ${verify_status}`, vendor: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.toggleAvailability = (req, res) => {
  try {
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const updated = Vendor.toggleAvailability(req.params.id);
    res.status(200).json({
      success: true,
      message: `Vendor is now ${updated.is_available ? 'available' : 'unavailable'}`,
      vendor: updated,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.addVendorService = (req, res) => {
  try {
    const { service_id } = req.body;
    if (!service_id) return res.status(400).json({ message: 'service_id required' });
    const result = Vendor.addService(req.params.id, service_id);
    if (!result.success) return res.status(409).json({ message: result.message });
    const services = Vendor.getServices(req.params.id);
    res.status(200).json({ success: true, message: 'Service assigned', services });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.removeVendorService = (req, res) => {
  try {
    Vendor.removeService(req.params.id, req.params.service_id);
    const services = Vendor.getServices(req.params.id);
    res.status(200).json({ success: true, message: 'Service removed', services });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getVendorServices = (req, res) => {
  try {
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const services = Vendor.getServices(req.params.id);
    res.status(200).json({ success: true, services });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.markAttendance = (req, res) => {
  try {
    const { date, status, note } = req.body;
    if (!date) return res.status(400).json({ message: 'date is required (YYYY-MM-DD)' });
    const allowed = ['present', 'absent', 'leave', 'holiday'];
    if (status && !allowed.includes(status))
      return res.status(400).json({ message: `status must be: ${allowed.join(', ')}` });
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const record = Vendor.markAttendance(req.params.id, date, status, note);
    res.status(200).json({ success: true, message: 'Attendance marked', attendance: record });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getAttendance = (req, res) => {
  try {
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const { month } = req.query;
    const attendance = Vendor.getAttendance(req.params.id, month);
    res.status(200).json({ success: true, count: attendance.length, attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getPerformance = (req, res) => {
  try {
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json({
      success: true,
      performance: {
        vendor_id:         vendor.id,
        name:              vendor.name,
        total_jobs:        vendor.total_jobs,
        completed_jobs:    vendor.completed_jobs,
        cancelled_jobs:    vendor.cancelled_jobs,
        completion_rate:   vendor.total_jobs > 0
          ? ((vendor.completed_jobs / vendor.total_jobs) * 100).toFixed(1) + '%'
          : '0%',
        avg_rating:        vendor.rating || 0,
        avg_response_time: vendor.avg_response_time || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.deleteVendor = (req, res) => {
  try {
    const vendor = Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    ['profile_photo', 'aadhaar_front', 'aadhaar_back', 'certificate'].forEach(field => {
      if (vendor[field]) {
        const filePath = path.join(__dirname, '../uploads/vendors', vendor[field]);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });
    Vendor.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Vendor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
// middleware/vendorAuthMiddleware.js
const jwt    = require('jsonwebtoken');
const Vendor = require('../models/Vendor.js');

/**
 * Protects vendor-only routes.
 * Expects:  Authorization: Bearer <vendor_token>
 * Attaches: req.vendor  (password-stripped vendor row)
 */
const protectVendor = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token must have been issued for a vendor (not an admin)
    if (decoded.role !== 'vendor')
      return res.status(403).json({ success: false, message: 'Access denied: vendor token required' });

    const vendor = Vendor.findById(decoded.id); // already strips password
    if (!vendor)
      return res.status(401).json({ success: false, message: 'Vendor not found' });

    // Block suspended vendors from accessing protected endpoints
    if (vendor.status === 'suspended')
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });

    req.vendor = vendor;
    next();
  } catch (err) {
    console.error('Vendor Token Error:', err.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protectVendor };
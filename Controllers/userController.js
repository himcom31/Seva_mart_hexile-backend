const User    = require('../models/User');
const Booking = require('../models/Book');

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
exports.getAllUsers = (req, res) => {
  try {
    const { is_active, is_blocked, city } = req.query;
    const users = User.findAll({
      is_active:  is_active  !== undefined ? parseInt(is_active)  : undefined,
      is_blocked: is_blocked !== undefined ? parseInt(is_blocked) : undefined,
      city
    });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// ─── Get Single User + Booking History (Admin) ────────────────────────────────
exports.getUserById = (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const bookings = Booking.findByUser(req.params.id);
    res.status(200).json({ success: true, user, bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// ─── Update User (Admin) ──────────────────────────────────────────────────────
exports.updateUser = (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { full_name, email, address, landmark, city } = req.body;
    const updated = User.update(req.params.id, {
      full_name: full_name || user.full_name,
      email:     email     ?? user.email,
      address:   address   ?? user.address,
      landmark:  landmark  ?? user.landmark,
      city:      city      || user.city
    });
    res.status(200).json({ success: true, message: 'User updated', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// ─── Block / Unblock User (Admin) ─────────────────────────────────────────────
exports.toggleBlock = (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updated = User.toggleBlock(req.params.id);
    res.status(200).json({
      success: true,
      message: `User ${updated.is_blocked ? 'blocked' : 'unblocked'}`,
      user: updated
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// ─── Delete User (Admin) ──────────────────────────────────────────────────────
exports.deleteUser = (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    User.delete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
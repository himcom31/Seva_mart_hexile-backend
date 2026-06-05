// models/Vendor.js
const db   = require('../config/db');
const bcrypt = require('bcryptjs');

db.exec(`
  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    aadhaar TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password TEXT,                          -- hashed password
    experience INTEGER DEFAULT 0,
    category_id INTEGER,
    subcategory_id INTEGER,
    city TEXT NOT NULL,
    address TEXT,
    profile_photo TEXT,
    aadhaar_front TEXT,
    aadhaar_back TEXT,
    certificate TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    verify_status TEXT NOT NULL DEFAULT 'pending',
    is_available INTEGER NOT NULL DEFAULT 1,
    vendor_type TEXT NOT NULL DEFAULT 'individual',
    rating REAL DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    cancelled_jobs INTEGER DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    notes TEXT,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS vendor_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE(vendor_id, service_id)
  );

  CREATE TABLE IF NOT EXISTS vendor_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'present',
    note TEXT,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    UNIQUE(vendor_id, date)
  );

  CREATE TABLE IF NOT EXISTS vendor_category_map (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  vendor_category_id INTEGER NOT NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_category_id) REFERENCES vendor_categories(id) ON DELETE CASCADE,
  UNIQUE(vendor_id, vendor_category_id)
);
`);

const Vendor = {

  // ── Auth helpers ────────────────────────────────────────────────────────────

  hashPassword: (plain) => bcrypt.hashSync(plain, 10),

  checkPassword: (plain, hash) => bcrypt.compareSync(plain, hash),

  // Strip password before returning to client
  _safe: (vendor) => {
    if (!vendor) return null;
    const { password, ...safe } = vendor;
    return safe;
  },

  // ── CRUD ────────────────────────────────────────────────────────────────────

  create: ({ name, mobile, aadhaar, email, password,
             experience, category_id, subcategory_id,
             city, address, profile_photo, aadhaar_front,
             aadhaar_back, certificate, vendor_type, notes }) => {

    const hashed = password ? Vendor.hashPassword(password) : null;

    const stmt = db.prepare(`
      INSERT INTO vendors
        (name, mobile, aadhaar, email, password, experience, category_id,
         subcategory_id, city, address, profile_photo, aadhaar_front,
         aadhaar_back, certificate, vendor_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, mobile, aadhaar, email ?? null, hashed,
      experience ?? 0, category_id ?? null, subcategory_id ?? null,
      city, address ?? null, profile_photo ?? null,
      aadhaar_front ?? null, aadhaar_back ?? null, certificate ?? null,
      vendor_type ?? 'individual', notes ?? null
    );

    return Vendor._safe(Vendor.findByIdRaw(result.lastInsertRowid));
  },

  // Returns row WITH password (for auth checks only — never send to client)
  findByIdRaw: (id) => {
    return db.prepare(`
      SELECT v.*, c.name as category_name
      FROM vendors v
      LEFT JOIN categories c ON v.category_id = c.id
      WHERE v.id = ?
    `).get(id) || null;
  },

  findById: (id) => Vendor._safe(Vendor.findByIdRaw(id)),

  findByMobileRaw:  (mobile)  => db.prepare('SELECT * FROM vendors WHERE mobile = ?').get(mobile)  || null,
  findByEmailRaw:   (email)   => db.prepare('SELECT * FROM vendors WHERE email = ?').get(email)    || null,
  findByAadhaar:    (aadhaar) => db.prepare('SELECT * FROM vendors WHERE aadhaar = ?').get(aadhaar) || null,

  findByMobile: (mobile) => Vendor._safe(Vendor.findByMobileRaw(mobile)),
  findByEmail:  (email)  => Vendor._safe(Vendor.findByEmailRaw(email)),

  findAll: ({ status, city, category_id, verify_status } = {}) => {
    let q = `SELECT v.id, v.name, v.mobile, v.email, v.experience,v.aadhaar,
                    v.category_id, v.subcategory_id, v.city, v.address,
                    v.profile_photo, v.status, v.verify_status, v.is_available,
                    v.vendor_type, v.rating, v.total_jobs, v.completed_jobs,
                    v.cancelled_jobs, v.avg_response_time, v.notes,
                    v.registered_at, c.name as category_name
             FROM vendors v
             LEFT JOIN categories c ON v.category_id = c.id
             WHERE 1=1`;
    const params = [];
    if (status)        { q += ' AND v.status = ?';        params.push(status); }
    if (city)          { q += ' AND v.city = ?';          params.push(city); }
    if (category_id)   { q += ' AND v.category_id = ?';   params.push(category_id); }
    if (verify_status) { q += ' AND v.verify_status = ?'; params.push(verify_status); }
    q += ' ORDER BY v.registered_at DESC';
    return db.prepare(q).all(...params);   // password never selected
  },

  update: (id, fields) => {
    // Never allow direct password update via this method
    const { password, ...rest } = fields;
    if (!Object.keys(rest).length) return Vendor.findById(id);
    const setClause = Object.keys(rest).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE vendors SET ${setClause} WHERE id = ?`).run(...Object.values(rest), id);
    return Vendor.findById(id);
  },

  // Dedicated safe password change
  updatePassword: (id, newPlain) => {
    const hashed = Vendor.hashPassword(newPlain);
    db.prepare('UPDATE vendors SET password = ? WHERE id = ?').run(hashed, id);
  },

  updateStatus: (id, status) => {
    db.prepare('UPDATE vendors SET status = ? WHERE id = ?').run(status, id);
    return Vendor.findById(id);
  },

  updateVerifyStatus: (id, verify_status) => {
    db.prepare('UPDATE vendors SET verify_status = ? WHERE id = ?').run(verify_status, id);
    return Vendor.findById(id);
  },

  toggleAvailability: (id) => {
    const vendor = Vendor.findByIdRaw(id);
    if (!vendor) return null;
    const newVal = vendor.is_available ? 0 : 1;
    db.prepare('UPDATE vendors SET is_available = ? WHERE id = ?').run(newVal, id);
    return Vendor.findById(id);
  },

  updateStats: (id, { completed_jobs, cancelled_jobs, rating }) => {
    const v = Vendor.findByIdRaw(id);
    if (!v) return null;
    const newCompleted = (v.completed_jobs || 0) + (completed_jobs || 0);
    const newCancelled = (v.cancelled_jobs || 0) + (cancelled_jobs || 0);
    const newTotalJobs = newCompleted + newCancelled;
    const newRating    = rating !== undefined ? rating : v.rating;
    db.prepare(`UPDATE vendors SET completed_jobs=?, cancelled_jobs=?, total_jobs=?, rating=? WHERE id=?`)
      .run(newCompleted, newCancelled, newTotalJobs, newRating, id);
    return Vendor.findById(id);
  },

  delete: (id) => db.prepare('DELETE FROM vendors WHERE id = ?').run(id),

  // ── Vendor Services (many-to-many) ──────────────────────────────────────────

  addService: (vendor_id, service_id) => {
    try {
      db.prepare('INSERT INTO vendor_services (vendor_id, service_id) VALUES (?, ?)').run(vendor_id, service_id);
      return { success: true };
    } catch { return { success: false, message: 'Service already assigned' }; }
  },

  

  removeService: (vendor_id, service_id) => {
    db.prepare('DELETE FROM vendor_services WHERE vendor_id = ? AND service_id = ?').run(vendor_id, service_id);
  },

  getServices: (vendor_id) => {
    return db.prepare(`
      SELECT s.id, s.name, s.code, c.name as category_name
      FROM vendor_services vs
      JOIN services s ON vs.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE vs.vendor_id = ?
    `).all(vendor_id);
  },

  // Vendor Category Map (many-to-many)
setVendorCategories: (vendor_id, category_ids = []) => {
  db.prepare('DELETE FROM vendor_category_map WHERE vendor_id = ?').run(vendor_id);
  const insert = db.prepare('INSERT OR IGNORE INTO vendor_category_map (vendor_id, vendor_category_id) VALUES (?, ?)');
  for (const cid of category_ids) insert.run(vendor_id, cid);
},

getVendorCategories: (vendor_id) => {
  return db.prepare(`
    SELECT vc.id, vc.name, vc.slug
    FROM vendor_category_map vcm
    JOIN vendor_categories vc ON vcm.vendor_category_id = vc.id
    WHERE vcm.vendor_id = ?
  `).all(vendor_id);
},

  // ── Attendance ───────────────────────────────────────────────────────────────

  markAttendance: (vendor_id, date, status, note) => {
    db.prepare(`
      INSERT INTO vendor_attendance (vendor_id, date, status, note)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(vendor_id, date) DO UPDATE SET status=excluded.status, note=excluded.note
    `).run(vendor_id, date, status ?? 'present', note ?? null);
    return db.prepare('SELECT * FROM vendor_attendance WHERE vendor_id = ? AND date = ?').get(vendor_id, date);
  },

  getAttendance: (vendor_id, month) => {
    let q = 'SELECT * FROM vendor_attendance WHERE vendor_id = ?';
    const params = [vendor_id];
    if (month) { q += ' AND date LIKE ?'; params.push(`${month}%`); }
    return db.prepare(q).all(...params);
  },
};

module.exports = Vendor;
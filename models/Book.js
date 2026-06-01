const db = require('../config/db');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_number         TEXT NOT NULL UNIQUE,
    service_id             INTEGER NOT NULL,
    service_name           TEXT NOT NULL,
    category_name          TEXT,
    service_code           TEXT,
    full_name              TEXT NOT NULL,
    mobile                 TEXT NOT NULL,
    address                TEXT NOT NULL,
    landmark               TEXT,
    city                   TEXT NOT NULL DEFAULT 'Patna',
    preferred_date         TEXT NOT NULL,
    preferred_time         TEXT NOT NULL,
    notes                  TEXT,
    status                 TEXT NOT NULL DEFAULT 'pending',
    vendor_id              INTEGER,
    vendor_name            TEXT,
    selected_sub_services  TEXT,
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  );
`);

// ── Safe migrations for existing databases ────────────────────────────────────
const existingCols = db.pragma('table_info(bookings)').map(c => c.name);
if (!existingCols.includes('vendor_id')) {
  db.exec('ALTER TABLE bookings ADD COLUMN vendor_id INTEGER;');
}
if (!existingCols.includes('vendor_name')) {
  db.exec('ALTER TABLE bookings ADD COLUMN vendor_name TEXT;');
}
if (!existingCols.includes('selected_sub_services')) {
  db.exec('ALTER TABLE bookings ADD COLUMN selected_sub_services TEXT;');
}

// ── Auto-generate booking number like BK-20240530-0001 ───────────────────────
const generateBookingNumber = () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const last  = db.prepare(
    `SELECT booking_number FROM bookings WHERE booking_number LIKE ? ORDER BY id DESC LIMIT 1`
  ).get(`BK-${today}-%`);
  if (!last) return `BK-${today}-0001`;
  const seq = parseInt(last.booking_number.split('-')[2]) + 1;
  return `BK-${today}-${String(seq).padStart(4, '0')}`;
};

const Booking = {
  create: ({
    service_id, service_name, category_name, service_code,
    full_name, mobile, address, landmark, city,
    preferred_date, preferred_time, notes,
    selected_sub_services  // ← JSON string of [{id, name}, ...]
  }) => {
    const booking_number = generateBookingNumber();
    const stmt = db.prepare(`
      INSERT INTO bookings
        (booking_number, service_id, service_name, category_name, service_code,
         full_name, mobile, address, landmark, city,
         preferred_date, preferred_time, notes, status, selected_sub_services)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);
    const result = stmt.run(
      booking_number, service_id, service_name, category_name ?? null,
      service_code ?? null, full_name, mobile, address,
      landmark ?? null, city ?? 'Patna', preferred_date, preferred_time,
      notes ?? null,
      selected_sub_services ?? null
    );
    return Booking.findById(result.lastInsertRowid);
  },
   findByVendorId: (vendor_id) =>
    db.prepare('SELECT * FROM bookings WHERE vendor_id = ? ORDER BY created_at DESC')
      .all(vendor_id),

  findById: (id) =>
    db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) || null,

  findByBookingNumber: (booking_number) =>
    db.prepare('SELECT * FROM bookings WHERE booking_number = ?').get(booking_number) || null,

  findAll: () =>
    db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all(),

  findByServiceId: (service_id) =>
    db.prepare('SELECT * FROM bookings WHERE service_id = ? ORDER BY created_at DESC').all(service_id),

  findByStatus: (status) =>
    db.prepare('SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC').all(status),

  updateStatus: (id, status) => {
    db.prepare(`UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, id);
    return Booking.findById(id);
  },

  update: (id, fields) => {
    const keys      = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE bookings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...Object.values(fields), id);
    return Booking.findById(id);
  },

  delete: (id) =>
    db.prepare('DELETE FROM bookings WHERE id = ?').run(id),

  getStats: () => {
    const total     = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const pending   = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get().count;
    const confirmed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'").get().count;
    const cancelled = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'").get().count;
    return { total, pending, confirmed, completed, cancelled };
  }
};

module.exports = Booking;
const db = require('../config/db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    landmark TEXT,
    city TEXT,
    profile_photo TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_blocked INTEGER NOT NULL DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    cancelled_bookings INTEGER DEFAULT 0,
    last_booking_at DATETIME,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const User = {
  create: ({ full_name, mobile, email, address, landmark, city, profile_photo }) => {
    const stmt = db.prepare(`
      INSERT INTO users (full_name, mobile, email, address, landmark, city, profile_photo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      full_name, mobile, email ?? null, address ?? null,
      landmark ?? null, city ?? null, profile_photo ?? null
    );
    return User.findById(result.lastInsertRowid);
  },

  findById: (id) =>
    db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null,

  findByMobile: (mobile) =>
    db.prepare('SELECT * FROM users WHERE mobile = ?').get(mobile) || null,

  findOrCreate: ({ full_name, mobile, email, address, landmark, city }) => {
    const existing = User.findByMobile(mobile);
    if (existing) {
      // Update details on each booking
      db.prepare(`UPDATE users SET full_name=?, email=?, address=?, landmark=?, city=?
                  WHERE id=?`)
        .run(full_name, email ?? existing.email, address ?? existing.address,
             landmark ?? existing.landmark, city ?? existing.city, existing.id);
      return User.findById(existing.id);
    }
    return User.create({ full_name, mobile, email, address, landmark, city });
  },

  findAll: ({ is_active, is_blocked, city } = {}) => {
    let q = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (is_active  !== undefined) { q += ' AND is_active = ?';  params.push(is_active); }
    if (is_blocked !== undefined) { q += ' AND is_blocked = ?'; params.push(is_blocked); }
    if (city)                     { q += ' AND city = ?';       params.push(city); }
    q += ' ORDER BY registered_at DESC';
    return db.prepare(q).all(...params);
  },

  update: (id, fields) => {
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...Object.values(fields), id);
    return User.findById(id);
  },

  toggleBlock: (id) => {
    const user = User.findById(id);
    if (!user) return null;
    db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(user.is_blocked ? 0 : 1, id);
    return User.findById(id);
  },

  incrementBookingCount: (id) => {
    db.prepare(`UPDATE users SET total_bookings = total_bookings + 1,
                last_booking_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  },

  updateBookingStats: (id, type) => {
    // type = 'completed' | 'cancelled'
    if (type === 'completed') {
      db.prepare('UPDATE users SET completed_bookings = completed_bookings + 1 WHERE id = ?').run(id);
    } else if (type === 'cancelled') {
      db.prepare('UPDATE users SET cancelled_bookings = cancelled_bookings + 1 WHERE id = ?').run(id);
    }
  },

  delete: (id) => db.prepare('DELETE FROM users WHERE id = ?').run(id)
};

module.exports = User;
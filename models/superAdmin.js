const db = require('../config/db');

const Admin = {
  findOne: ({ email, role } = {}) => {
    let query = 'SELECT * FROM admins WHERE 1=1';
    const params = [];

    if (email !== undefined) { query += ' AND email = ?'; params.push(email); }
    if (role  !== undefined) { query += ' AND role = ?';  params.push(role);  }

    return db.prepare(query).get(...params) || null;
  },

  findById: (id) => {
    return db.prepare('SELECT id, name, email, role, mobile FROM admins WHERE id = ?').get(id) || null;
  },

  create: ({ name, email, password, role = 'admin', mobile }) => {
    const stmt = db.prepare(
      'INSERT INTO admins (name, email, password, role, mobile) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, email, password, role, mobile ?? null);
    return { id: result.lastInsertRowid, name, email, role, mobile };
  }
};

module.exports = Admin;
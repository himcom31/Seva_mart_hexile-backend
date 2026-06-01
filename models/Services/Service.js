const db = require('../../config/db');

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    code TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    image TEXT,
    icon TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    verify_status TEXT NOT NULL DEFAULT 'pending',
    featured INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
`);

const Service = {
  create: ({ name, category_id, code, slug, image, icon, description, status, verify_status, featured }) => {
    const stmt = db.prepare(`
      INSERT INTO services (name, category_id, code, slug, image, icon, description, status, verify_status, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name, category_id, code, slug,
      image ?? null, icon ?? null, description ?? null,
      status ?? 'active',
      verify_status ?? 'pending',
      featured ? 1 : 0
    );
    return Service.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    return db.prepare(`
      SELECT s.*, c.name as category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(id) || null;
  },

  findByCode: (code) => {
    return db.prepare('SELECT * FROM services WHERE code = ?').get(code) || null;
  },

  findBySlug: (slug) => {
    return db.prepare('SELECT * FROM services WHERE slug = ?').get(slug) || null;
  },

  findAll: () => {
    return db.prepare(`
      SELECT s.*, c.name as category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
    `).all();
  },

  findByCategoryId: (category_id) => {
    return db.prepare(`
      SELECT s.*, c.name as category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.category_id = ?
      ORDER BY s.created_at DESC
    `).all(category_id);
  },

  // Auto-generate code like PROD001, ELP001
  generateCode: (prefix = 'PROD') => {
    const last = db.prepare(
      `SELECT code FROM services WHERE code LIKE ? ORDER BY id DESC LIMIT 1`
    ).get(`${prefix}%`);
    if (!last) return `${prefix}001`;
    const num = parseInt(last.code.replace(prefix, '')) + 1;
    return `${prefix}${String(num).padStart(3, '0')}`;
  },

  update: (id, fields) => {
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE services SET ${setClause} WHERE id = ?`).run(...Object.values(fields), id);
    return Service.findById(id);
  },

  updateStatus: (id, status) => {
    db.prepare('UPDATE services SET status = ? WHERE id = ?').run(status, id);
    return Service.findById(id);
  },

  updateVerifyStatus: (id, verify_status) => {
    db.prepare('UPDATE services SET verify_status = ? WHERE id = ?').run(verify_status, id);
    return Service.findById(id);
  },

  delete: (id) => {
    return db.prepare('DELETE FROM services WHERE id = ?').run(id);
  }
};

module.exports = Service;
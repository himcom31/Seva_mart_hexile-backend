const db = require('../../config/db');

// Table is already created in config/db.js — no need to repeat it here

const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const Service = {
  create: ({ name, category_id, code, slug, image, icon, description, status, verify_status, featured }) => {
    const stmt = db.prepare(`
      INSERT INTO services (name, category_id, code, slug, image, icon, description, status, verify_status, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name, category_id, code, slug,
      image        ?? null,
      icon         ?? null,
      description  ?? null,
      status       ?? 'active',
      verify_status ?? 'pending',
      featured ? 1 : 0
    );
    return Service.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    return db.prepare(`
      SELECT s.*, c.name AS category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(id) ?? null;
  },

  findByCode: (code) => {
    return db.prepare('SELECT * FROM services WHERE code = ?').get(code) ?? null;
  },

  findBySlug: (slug) => {
    return db.prepare('SELECT * FROM services WHERE slug = ?').get(slug) ?? null;
  },

  findAll: () => {
    return db.prepare(`
      SELECT s.*, c.name AS category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
    `).all();
  },

  findByCategoryId: (category_id) => {
    return db.prepare(`
      SELECT s.*, c.name AS category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.category_id = ?
      ORDER BY s.created_at DESC
    `).all(category_id);
  },

  generateCode: (prefix = 'PROD') => {
    const last = db.prepare(
      `SELECT code FROM services WHERE code LIKE ? ORDER BY id DESC LIMIT 1`
    ).get(`${prefix}%`);
    if (!last) return `${prefix}001`;
    const num = parseInt(last.code.replace(prefix, '')) + 1;
    return `${prefix}${String(num).padStart(3, '0')}`;
  },

  update: (id, fields) => {
    const keys      = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE services SET ${setClause} WHERE id = ?`)
      .run(...Object.values(fields), id);
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
  },
};

module.exports = Service;
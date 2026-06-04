const db = require('../config/db');

const VendorCategory = {

  create: (data) => {
    const { name, slug, description, icon } = data;
    const result = db.prepare(`
      INSERT INTO vendor_categories (name, slug, description, icon)
      VALUES (?, ?, ?, ?)
    `).run(name, slug, description || null, icon || null);
    return { id: result.lastInsertRowid, name, slug, description, icon, is_active: 1 };
  },

  getAll: () => {
    return db.prepare(`SELECT * FROM vendor_categories ORDER BY created_at DESC`).all();
  },

  getById: (id) => {
    return db.prepare(`SELECT * FROM vendor_categories WHERE id = ?`).get(id);
  },

  getBySlug: (slug) => {
    return db.prepare(`SELECT * FROM vendor_categories WHERE slug = ?`).get(slug);
  },

  update: (id, data) => {
    const { name, slug, description, icon, is_active } = data;
    return db.prepare(`
      UPDATE vendor_categories
      SET name = ?, slug = ?, description = ?, icon = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, slug, description || null, icon || null, is_active ?? 1, id);
  },

  softDelete: (id) => {
    return db.prepare(`
      UPDATE vendor_categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  },

  delete: (id) => {
    return db.prepare(`DELETE FROM vendor_categories WHERE id = ?`).run(id);
  },

};

module.exports = VendorCategory;
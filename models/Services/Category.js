const db = require('../../config/db');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language TEXT NOT NULL DEFAULT 'en',
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image TEXT,
    icon TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    featured INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const Category = {
  create: ({ language, name, slug, image, icon, description, status, featured }) => {
    const stmt = db.prepare(`
      INSERT INTO categories (language, name, slug, image, icon, description, status, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(language, name, slug, image ?? null, icon ?? null, description ?? null, status ?? 'active', featured ? 1 : 0);
    return Category.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) || null;
  },

  findBySlug: (slug) => {
    return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug) || null;
  },

  findAll: () => {
    return db.prepare('SELECT * FROM categories ORDER BY created_at DESC').all();
  },

  update: (id, fields) => {
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    db.prepare(`UPDATE categories SET ${setClause} WHERE id = ?`).run(...values, id);
    return Category.findById(id);
  },

  delete: (id) => {
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
};

module.exports = Category;
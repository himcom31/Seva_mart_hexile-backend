const db = require('../../config/db');

db.exec(`
  CREATE TABLE IF NOT EXISTS sub_services (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id  INTEGER NOT NULL,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    image       TEXT,
    icon        TEXT,
    description TEXT,
    price       REAL,
    status      TEXT NOT NULL DEFAULT 'active',
    featured    INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  );
`);

const SubService = {
  create: ({ service_id, name, slug, image, icon, description, price, status, featured }) => {
    const stmt = db.prepare(`
      INSERT INTO sub_services (service_id, name, slug, image, icon, description, price, status, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      service_id, name, slug,
      image       ?? null,
      icon        ?? null,
      description ?? null,
      price       ?? null,
      status      ?? 'active',
      featured ? 1 : 0
    );
    return SubService.findById(result.lastInsertRowid);
  },

  findById: (id) =>
    db.prepare(`
      SELECT ss.*, s.name AS service_name, c.name AS category_name
      FROM sub_services ss
      LEFT JOIN services  s ON ss.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ss.id = ?
    `).get(id) || null,

  findBySlug: (slug) =>
    db.prepare('SELECT * FROM sub_services WHERE slug = ?').get(slug) || null,

  findAll: () =>
    db.prepare(`
      SELECT ss.*, s.name AS service_name, c.name AS category_name
      FROM sub_services ss
      LEFT JOIN services  s ON ss.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY ss.created_at DESC
    `).all(),

  findByServiceId: (service_id) =>
    db.prepare(`
      SELECT ss.*, s.name AS service_name, c.name AS category_name
      FROM sub_services ss
      LEFT JOIN services  s ON ss.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ss.service_id = ?
      ORDER BY ss.created_at DESC
    `).all(service_id),

  findByCategoryId: (category_id) =>
    db.prepare(`
      SELECT ss.*, s.name AS service_name, c.name AS category_name
      FROM sub_services ss
      LEFT JOIN services  s ON ss.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.category_id = ?
      ORDER BY ss.created_at DESC
    `).all(category_id),

  update: (id, fields) => {
    const keys      = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE sub_services SET ${setClause} WHERE id = ?`).run(...Object.values(fields), id);
    return SubService.findById(id);
  },

  delete: (id) =>
    db.prepare('DELETE FROM sub_services WHERE id = ?').run(id),
};

module.exports = SubService;
const Database = require('better-sqlite3');
const path     = require('path');

// On Render: set DB_PATH=/data/database.sqlite (persistent disk)
// Locally:   falls back to project root
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    name       TEXT,
    email      TEXT     NOT NULL UNIQUE,
    password   TEXT     NOT NULL,
    mobile     TEXT,
    role       TEXT     NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    name       TEXT,
    email      TEXT     NOT NULL UNIQUE,
    password   TEXT     NOT NULL,
    role       TEXT     NOT NULL DEFAULT 'doctor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vendor_categories (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    name        TEXT     NOT NULL UNIQUE,
    slug        TEXT     NOT NULL UNIQUE,
    description TEXT,
    icon        TEXT,
    is_active   INTEGER  NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log(`SQLite Connected: ${dbPath}`);

module.exports = db;
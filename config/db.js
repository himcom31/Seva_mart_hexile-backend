const Database = require('better-sqlite3');
const path     = require('path');

// /data = Render persistent disk (survives deploys)
// fallback to local path in development
const dbPath = process.env.NODE_ENV === 'production'
  ? '/data/database.sqlite'
  : path.join(__dirname, '../database.sqlite');

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    mobile     TEXT,
    role       TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'doctor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vendor_categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    slug        TEXT    NOT NULL UNIQUE,
    description TEXT,
    icon        TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    category_id   INTEGER NOT NULL,
    code          TEXT    NOT NULL UNIQUE,
    slug          TEXT    NOT NULL UNIQUE,
    image         TEXT,
    icon          TEXT,
    description   TEXT,
    status        TEXT    NOT NULL DEFAULT 'active',
    verify_status TEXT    NOT NULL DEFAULT 'pending',
    featured      INTEGER NOT NULL DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
`);

console.log(`SQLite Connected: ${dbPath}`);

module.exports = db;
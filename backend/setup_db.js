const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./coffee.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    q1_text TEXT NOT NULL,
    sec_q1 TEXT NOT NULL,
    q2_text TEXT NOT NULL,
    sec_q2 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Added 'processing' column here
  db.run(`CREATE TABLE IF NOT EXISTS beans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    roaster TEXT NOT NULL,
    name TEXT NOT NULL,
    roast_level TEXT,
    origin TEXT,
    varietal TEXT,
    processing TEXT, 
    sweetness INTEGER,
    acidity INTEGER,
    bitterness INTEGER,
    body INTEGER,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    product TEXT NOT NULL,
    category TEXT,
    burr_type TEXT,
    burr_size TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS brew_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    roaster TEXT,
    bean TEXT,
    brew_date TEXT,
    roast_date TEXT,
    equipment TEXT,
    method TEXT,
    grinder TEXT,
    grind_size TEXT,
    temp REAL,
    time INTEGER,
    pressure TEXT,
    pours INTEGER,
    dose REAL,
    yield_out REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  console.log("Database tables created successfully!");
});

db.close();
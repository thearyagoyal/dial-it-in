const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to the SQLite Database
const db = new sqlite3.Database('./coffee.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the coffee.db database.');
  }
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// 1. Sign Up
app.post('/api/signup', async (req, res) => {
  const { username, password, q1_text, sec_q1, q2_text, sec_q2 } = req.body;
  
  try {
    // Hash the password and the security answers (converting answers to lowercase for easier matching later)
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashQ1 = await bcrypt.hash(sec_q1.toLowerCase(), 10);
    const hashQ2 = await bcrypt.hash(sec_q2.toLowerCase(), 10);

    const sql = `INSERT INTO users (username, password, q1_text, sec_q1, q2_text, sec_q2) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [username, hashedPassword, q1_text, hashQ1, q2_text, hashQ2], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username is already taken.' });
        }
        return res.status(500).json({ error: 'Database error during registration.' });
      }
      res.json({ message: 'Record created successfully! Please log in.' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error processing registration.' });
  }
});

// 2. Log In
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) return res.status(400).json({ error: 'Invalid username or password.' });

    // Compare entered password with the encrypted password in the DB
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid username or password.' });

    res.json({ message: 'Login successful', user_id: user.id, username: user.username });
  });
});

// 3. Get Security Questions (Forgot Password - Step 1)
app.post('/api/get-questions', (req, res) => {
  const { username } = req.body;
  
  db.get(`SELECT q1_text, q2_text FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) return res.status(400).json({ error: 'Account not found.' });
    
    res.json({ q1: user.q1_text, q2: user.q2_text });
  });
});

// 4. Reset Password (Forgot Password - Step 2)
app.post('/api/reset-password', (req, res) => {
  const { username, new_password, ans1, ans2 } = req.body;
  
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) return res.status(400).json({ error: 'Account not found.' });

    // Compare the provided answers against the encrypted answers in the DB
    const match1 = await bcrypt.compare(ans1.toLowerCase(), user.sec_q1);
    const match2 = await bcrypt.compare(ans2.toLowerCase(), user.sec_q2);

    if (!match1 || !match2) {
      return res.status(400).json({ error: 'One or both security answers are incorrect.' });
    }

    // If answers match, hash the new password and update the database
    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    db.run(`UPDATE users SET password = ? WHERE username = ?`, [hashedNewPassword, username], (err) => {
      if (err) return res.status(500).json({ error: 'Database error while updating password.' });
      res.json({ message: 'Password reset successfully. You can now log in.' });
    });
  });
});

// ==========================================
// BEANS ROUTES
// ==========================================

// Save a new bean
app.post('/api/beans', (req, res) => {
  const { user_id, roaster, name, roast_level, origin, varietal, processing, sweetness, acidity, bitterness, body, link } = req.body;
  
  const sql = `INSERT INTO beans (user_id, roaster, name, roast_level, origin, varietal, processing, sweetness, acidity, bitterness, body, link) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
               
  db.run(sql, [user_id, roaster, name, roast_level, origin, varietal, processing, sweetness, acidity, bitterness, body, link], function(err) {
    if (err) return res.status(500).json({ error: 'Database error saving bean.' });
    res.json({ message: 'Bean saved!', id: this.lastID });
  });
});

// Get all beans
app.get('/api/beans', (req, res) => {
  db.all(`SELECT * FROM beans ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error fetching beans.' });
    res.json(rows);
  });
});

// ==========================================
// EQUIPMENT ROUTES
// ==========================================

app.post('/api/equipment', (req, res) => {
  const { user_id, type, manufacturer, product, category, burr_type, burr_size } = req.body;
  
  const sql = `INSERT INTO equipment (user_id, type, manufacturer, product, category, burr_type, burr_size) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
               
  db.run(sql, [user_id, type, manufacturer, product, category, burr_type, burr_size], function(err) {
    if (err) return res.status(500).json({ error: 'Database error saving equipment.' });
    res.json({ message: 'Equipment saved!', id: this.lastID });
  });
});

app.get('/api/equipment', (req, res) => {
  db.all(`SELECT * FROM equipment ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error fetching equipment.' });
    res.json(rows);
  });
});

// ==========================================
// BREW LOG ROUTES (THE DIARY)
// ==========================================

app.post('/api/brew_logs', (req, res) => {
  const { user_id, roaster, bean, brew_date, roast_date, equipment, method, grinder, grind_size, temp, time, pressure, pours, dose, yield_out, notes } = req.body;
  
  const sql = `INSERT INTO brew_logs (user_id, roaster, bean, brew_date, roast_date, equipment, method, grinder, grind_size, temp, time, pressure, pours, dose, yield_out, notes) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
               
  db.run(sql, [user_id, roaster, bean, brew_date, roast_date, equipment, method, grinder, grind_size, temp, time, pressure, pours, dose, yield_out, notes], function(err) {
    if (err) return res.status(500).json({ error: 'Database error saving brew log.' });
    res.json({ message: 'Brew log saved!', id: this.lastID });
  });
});

app.get('/api/brew_logs', (req, res) => {
  db.all(`SELECT * FROM brew_logs ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error fetching brew logs.' });
    res.json(rows);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
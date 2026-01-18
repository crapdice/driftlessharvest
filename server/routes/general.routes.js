const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkRole } = require('../middleware/auth');

/*
  DELIVERY WINDOWS API
*/

// GET /api/delivery-windows (Public)
router.get('/delivery-windows', (req, res) => {
  try {
    // Check if table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='delivery_windows'").all();
    if (tables.length === 0) {
      return res.json([]);
    }

    // Check which columns exist
    const cols = db.prepare("PRAGMA table_info(delivery_windows)").all().map(c => c.name);
    const hasDateValue = cols.includes('date_value');
    const hasIsActive = cols.includes('is_active');

    const today = new Date().toISOString().split('T')[0];

    if (hasDateValue && hasIsActive) {
      // Full schema: filter by is_active and date_value
      const wins = db.prepare(`
                SELECT * FROM delivery_windows 
                WHERE is_active = 1 AND date_value >= ?
                ORDER BY date_value ASC
                LIMIT 4
            `).all(today);
      res.json(wins);
    } else if (hasDateValue) {
      // Has date_value but no is_active
      const wins = db.prepare(`
                SELECT * FROM delivery_windows 
                WHERE date_value >= ?
                ORDER BY date_value ASC
                LIMIT 4
            `).all(today);
      res.json(wins);
    } else {
      // Original schema - return all
      const wins = db.prepare('SELECT * FROM delivery_windows LIMIT 4').all();
      res.json(wins);
    }
  } catch (err) {
    console.error('[Public Delivery Windows Error]', err);
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});



// POST /api/general/launch-signup (Public)
router.post('/launch-signup', (req, res) => {
  const { email, variant, utm_source } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.get('User-Agent');

    const insert = db.prepare(`
            INSERT INTO launch_signups (email, source_variant, ip_address, user_agent, utm_source)
            VALUES (?, ?, ?, ?, ?)
        `);

    insert.run(email, variant || 'unknown', ip, ua, utm_source || 'organic');

    res.status(201).json({ success: true, message: 'Signed up successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This email is already on the waitlist.' });
    }
    console.error('[Launch Signup Error]', err);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
});

// POST /api/ab-exposure
router.post('/ab-exposure', (req, res) => res.status(204).send());

module.exports = router;

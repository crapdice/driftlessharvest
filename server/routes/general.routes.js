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
        // Return only future windows, sorted by date, limit 4
        const today = new Date().toISOString().split('T')[0];
        const wins = db.prepare(`
      SELECT * FROM delivery_windows 
      WHERE is_active = 1 AND date_value >= ?
      ORDER BY date_value ASC
      LIMIT 4
    `).all(today);
        res.json(wins);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});



// POST /api/ab-exposure
router.post('/ab-exposure', (req, res) => res.status(204).send());

module.exports = router;

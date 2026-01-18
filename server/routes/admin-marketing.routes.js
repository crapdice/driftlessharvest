const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkRole } = require('../middleware/auth');

// All routes here require at least 'admin' role
router.use(checkRole(['admin', 'super_admin', 'superadmin']));

/**
 * GET /api/admin/marketing/signups
 * Returns all launch signups sorted by newest first
 */
router.get('/signups', (req, res) => {
    try {
        const signups = db.prepare(`
            SELECT * FROM launch_signups 
            ORDER BY created_at DESC
        `).all();
        res.json(signups);
    } catch (err) {
        console.error('[Admin Marketing Signups Error]', err);
        res.status(500).json({ error: 'Failed to fetch signups' });
    }
});

/**
 * GET /api/admin/marketing/stats
 * Returns conversion stats per variant
 */
router.get('/stats', (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT source_variant as variant, COUNT(*) as count 
            FROM launch_signups 
            GROUP BY source_variant
            ORDER BY count DESC
        `).all();
        res.json(stats);
    } catch (err) {
        console.error('[Admin Marketing Stats Error]', err);
        res.status(500).json({ error: 'Failed to fetch marketing stats' });
    }
});

/**
 * DELETE /api/admin/marketing/signups/:id
 * Remove a signup (e.g. spam)
 */
router.delete('/signups/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM launch_signups WHERE id = ?').run(req.params.id);
        res.status(204).send();
    } catch (err) {
        console.error('[Admin Marketing Delete Error]', err);
        res.status(500).json({ error: 'Failed to delete signup' });
    }
});

module.exports = router;

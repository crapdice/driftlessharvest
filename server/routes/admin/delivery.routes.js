/**
 * Admin Delivery Routes
 * 
 * Handles delivery windows and schedule management.
 * Extracted from admin.routes.js for better organization.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { checkRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { deliveryWindowSchema } = require('../../schemas');

// GET /api/admin/delivery-schedule
router.get('/admin/delivery-schedule', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        // Check if delivery_date column exists
        const cols = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);

        let schedule;
        if (cols.includes('delivery_date') && cols.includes('delivery_window')) {
            // Full query with delivery_date sorting
            schedule = db.prepare(`
                SELECT delivery_window as date, count(*) as count 
                FROM orders 
                WHERE status IN ('Pending', 'Paid', 'Packed') 
                  AND delivery_window IS NOT NULL 
                  AND delivery_window != ''
                GROUP BY delivery_window
                ORDER BY delivery_date ASC
            `).all();
        } else if (cols.includes('delivery_window')) {
            // Fallback without delivery_date column
            schedule = db.prepare(`
                SELECT delivery_window as date, count(*) as count 
                FROM orders 
                WHERE status IN ('Pending', 'Paid', 'Packed') 
                  AND delivery_window IS NOT NULL 
                  AND delivery_window != ''
                GROUP BY delivery_window
            `).all();
        } else {
            // No delivery columns at all - return empty
            console.warn('[Delivery] orders table missing delivery columns');
            schedule = [];
        }

        res.json(schedule);
    } catch (e) {
        console.error("Delivery Schedule Error:", e);
        res.status(500).json({ error: 'Failed', details: e.message });
    }
});


// GET /api/admin/delivery-windows
router.get('/admin/delivery-windows', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        // Check if delivery_windows table exists
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='delivery_windows'").all();
        if (tables.length === 0) {
            console.warn('[Delivery] delivery_windows table does not exist');
            return res.json([]);
        }

        // Check which columns exist
        const cols = db.prepare("PRAGMA table_info(delivery_windows)").all().map(c => c.name);
        const hasDateValue = cols.includes('date_value');
        const hasIsActive = cols.includes('is_active');

        console.log('[Delivery] columns:', cols.join(', '));

        const today = new Date().toISOString().split('T')[0];

        if (hasDateValue && hasIsActive) {
            // Full functionality: Auto-archive past windows
            db.prepare('UPDATE delivery_windows SET is_active = 0 WHERE date_value < ? AND is_active = 1').run(today);

            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const windows = db.prepare('SELECT * FROM delivery_windows WHERE date_value >= ? ORDER BY date_value').all(thirtyDaysAgo);
            return res.json(windows);
        } else if (hasDateValue) {
            // Has date_value but no is_active
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const windows = db.prepare('SELECT * FROM delivery_windows WHERE date_value >= ? ORDER BY date_value').all(thirtyDaysAgo);
            return res.json(windows);
        } else {
            // Minimal schema - just return all windows
            const windows = db.prepare('SELECT * FROM delivery_windows').all();
            return res.json(windows);
        }
    } catch (e) {
        console.error('[Delivery Windows Error]', e);
        res.status(500).json({ error: 'Failed', details: e.message });
    }
});

// POST /api/admin/delivery-windows
router.post('/admin/delivery-windows', checkRole(['admin', 'super_admin']), validate(deliveryWindowSchema), (req, res) => {
    try {
        const { date_label, date_value } = req.body;

        // Prevent past dates
        const today = new Date().toISOString().split('T')[0];
        if (date_value < today) {
            return res.status(400).json({ error: "Cannot schedule a delivery window in the past." });
        }

        // Check which columns exist
        const cols = db.prepare("PRAGMA table_info(delivery_windows)").all().map(c => c.name);
        console.log('[Delivery POST] columns:', cols.join(', '));

        // Calculate day_of_week from date_value for NOT NULL constraint
        const dayOfWeek = new Date(date_value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });

        // Build INSERT based on available columns
        if (cols.includes('date_label') && cols.includes('date_value') && cols.includes('is_active')) {
            // New schema columns exist
            if (cols.includes('day_of_week') && cols.includes('start_time') && cols.includes('end_time')) {
                // Hybrid schema: has both old and new columns
                const info = db.prepare('INSERT INTO delivery_windows (date_label, date_value, is_active, day_of_week, start_time, end_time) VALUES (?, ?, 1, ?, ?, ?)')
                    .run(date_label, date_value, dayOfWeek, '08:00', '18:00');
                return res.json({ success: true, id: info.lastInsertRowid });
            } else {
                // Pure new schema: only date_label, date_value, is_active
                const info = db.prepare('INSERT INTO delivery_windows (date_label, date_value, is_active) VALUES (?, ?, 1)')
                    .run(date_label, date_value);
                return res.json({ success: true, id: info.lastInsertRowid });
            }
        } else if (cols.includes('date_value') && !cols.includes('date_label')) {
            // Partial migration - has date_value but not date_label
            const info = db.prepare('INSERT INTO delivery_windows (day_of_week, start_time, end_time, date_value) VALUES (?, ?, ?, ?)')
                .run(dayOfWeek, '08:00', '18:00', date_value);
            return res.json({ success: true, id: info.lastInsertRowid });
        } else {
            // Original schema - use day_of_week, start_time, end_time
            const info = db.prepare('INSERT INTO delivery_windows (day_of_week, start_time, end_time) VALUES (?, ?, ?)')
                .run(dayOfWeek, '08:00', '18:00');
            return res.json({ success: true, id: info.lastInsertRowid });
        }
    } catch (e) {
        console.error('[Delivery POST Error]', e);
        res.status(500).json({ error: 'Failed', details: e.message });
    }
});

// PUT /api/admin/delivery-windows/:id
router.put('/admin/delivery-windows/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const { is_active } = req.body;

        // Check if is_active column exists
        const cols = db.prepare("PRAGMA table_info(delivery_windows)").all().map(c => c.name);

        if (cols.includes('is_active')) {
            db.prepare('UPDATE delivery_windows SET is_active = ? WHERE id = ?')
                .run(is_active ? 1 : 0, req.params.id);
            res.json({ success: true });
        } else {
            // is_active column doesn't exist - just return success
            console.warn('[Delivery PUT] is_active column not found, skipping');
            res.json({ success: true, warning: 'is_active column not available' });
        }
    } catch (e) {
        console.error('[Delivery PUT Error]', e);
        res.status(500).json({ error: 'Failed', details: e.message });
    }
});

// DELETE /api/admin/delivery-windows/:id
router.delete('/admin/delivery-windows/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        db.prepare('DELETE FROM delivery_windows WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (e) {
        console.error('[Delivery DELETE Error]', e);
        res.status(500).json({ error: 'Failed', details: e.message });
    }
});

module.exports = router;

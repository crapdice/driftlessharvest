const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const { checkRole } = require('../middleware/auth');

// POST /api/admin/utilities/clean-database
router.post('/admin/utilities/clean-database', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting database cleanup...');

        // Delete in correct order (foreign keys)
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const users = db.prepare(`DELETE FROM users WHERE email != 'admin@driftlessharvest.com'`).run();
        const addresses = db.prepare('DELETE FROM addresses').run();
        const carts = db.prepare('DELETE FROM active_carts').run();
        const payments = db.prepare('DELETE FROM payments').run();

        console.log('[Utilities] Database cleanup complete');

        res.json({
            success: true,
            deleted: {
                orderItems: orderItems.changes,
                orders: orders.changes,
                users: users.changes,
                addresses: addresses.changes,
                carts: carts.changes,
                payments: payments.changes
            }
        });
    } catch (error) {
        console.error('[Utilities] Cleanup error:', error);
        res.status(500).json({ error: 'Failed to clean database', details: error.message });
    }
});

// GET /api/admin/utilities/verify-database
router.get('/admin/utilities/verify-database', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const admins = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get().count;
        const orders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
        const products = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

        res.json({
            success: true,
            counts: {
                users,
                admins,
                orders,
                products
            }
        });
    } catch (error) {
        console.error('[Utilities] Verify error:', error);
        res.status(500).json({ error: 'Failed to verify database', details: error.message });
    }
});

// POST /api/admin/utilities/clean-temp-files
router.post('/admin/utilities/clean-temp-files', checkRole(['super_admin']), (req, res) => {
    try {
        const filesToDelete = [
            path.join(__dirname, '../../cleanup-db.js'),
            path.join(__dirname, '../../cleanup-result.txt')
        ];

        let deleted = 0;
        filesToDelete.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                deleted++;
                console.log(`[Utilities] Deleted: ${file}`);
            }
        });

        res.json({
            success: true,
            deleted,
            message: `Deleted ${deleted} temporary file(s)`
        });
    } catch (error) {
        console.error('[Utilities] Clean temp files error:', error);
        res.status(500).json({ error: 'Failed to clean temp files', details: error.message });
    }
});

// GET /api/admin/utilities/query/:table
router.get('/admin/utilities/query/:table', checkRole(['admin', 'super_admin']), (req, res) => {
    const { table } = req.params;
    const allowedTables = ['users', 'orders', 'products', 'delivery_windows', 'addresses', 'categories', 'box_templates'];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    try {
        const results = db.prepare(`SELECT * FROM ${table} LIMIT 100`).all();
        res.json({ success: true, results, count: results.length });
    } catch (error) {
        console.error('[Utilities Query Error]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

/**
 * Admin Stats Routes
 * 
 * Handles dashboard statistics endpoints.
 * Extracted from admin.routes.js for better organization.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { checkRole } = require('../../middleware/auth');

// GET /api/admin/stats
router.get('/admin/stats', checkRole(['admin', 'super_admin']), (req, res) => {
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const revenue = db.prepare('SELECT SUM(total) as total FROM orders').get().total || 0;
    const pending = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'").get().count;

    res.json({ orderCount, revenue, pending });
});

module.exports = router;

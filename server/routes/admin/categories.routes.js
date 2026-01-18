/**
 * Admin Categories Routes
 * 
 * Handles category management.
 * Extracted from admin.routes.js for better organization.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { checkRole } = require('../../middleware/auth');

// POST /api/admin/categories
router.post('/admin/categories', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { name, description, image_url, is_active } = req.body;

        // Check which columns exist in categories table
        const cols = db.prepare("PRAGMA table_info(categories)").all().map(c => c.name);
        console.log('[Categories POST] columns:', cols.join(', '));

        if (cols.includes('description') && cols.includes('image_url') && cols.includes('is_active')) {
            // Full schema
            const info = db.prepare(`
                INSERT INTO categories (name, description, image_url, is_active)
                VALUES (@name, @description, @image_url, @is_active)
            `).run({
                name, description: description || '', image_url: image_url || '',
                is_active: is_active === undefined ? 1 : (is_active ? 1 : 0)
            });
            res.json({ success: true, id: info.lastInsertRowid });
        } else if (cols.includes('display_order')) {
            // Minimal schema from migration 017: only name and display_order
            const info = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, 99)').run(name);
            res.json({ success: true, id: info.lastInsertRowid });
        } else {
            // Fallback: just name
            const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
            res.json({ success: true, id: info.lastInsertRowid });
        }
    } catch (e) {
        console.error("[Categories POST Error]", e);
        res.status(500).json({ error: 'Failed to create category', details: e.message });
    }
});

module.exports = router;

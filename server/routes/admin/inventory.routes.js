/**
 * Admin Inventory Routes
 * 
 * Handles inventory status and active carts endpoints.
 * Extracted from admin.routes.js for better organization.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { checkRole } = require('../../middleware/auth');

// GET /api/admin/inventory-status (Lightweight endpoint for navbar low stock indicator)
router.get('/admin/inventory-status', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        // Default threshold is 10, but can be overridden by query param
        const threshold = parseInt(req.query.threshold) || 10;

        // Check if is_archived column exists
        const cols = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
        const hasIsArchived = cols.includes('is_archived');

        // Get active products with stock below threshold (limit to 10 for tooltip)
        const query = hasIsArchived
            ? `SELECT id, name, stock FROM products WHERE is_active = 1 AND is_archived = 0 AND stock < ? ORDER BY stock ASC LIMIT 10`
            : `SELECT id, name, stock FROM products WHERE is_active = 1 AND stock < ? ORDER BY stock ASC LIMIT 10`;

        const products = db.prepare(query).all(threshold);

        console.log(`[Inventory Status] Found ${products.length} low stock items (threshold: ${threshold})`);

        res.json({
            lowStockCount: products.length,
            threshold,
            products: products.map(p => ({ name: p.name, stock: p.stock }))
        });
    } catch (e) {
        console.error('[Inventory Status] Error:', e);
        res.status(500).json({ error: 'Failed to check inventory status' });
    }
});

// GET /api/admin/active-carts
router.get('/admin/active-carts', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const carts = db.prepare('SELECT * FROM active_carts ORDER BY updated_at DESC').all();
        const products = db.prepare('SELECT id, category FROM products').all();
        const productMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p.category }), {});

        const parsed = carts.map(c => {
            let items = JSON.parse(c.items || '[]');
            // Enrich items with category
            items = items.map(i => ({
                ...i,
                category: i.type === 'box' ? 'Curated Box' : (productMap[i.id] || 'Uncategorized')
            }));

            return {
                email: c.user_email,
                items: items,
                updated_at: c.updated_at
            };
        });
        res.json(parsed);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch active carts' });
    }
});

module.exports = router;

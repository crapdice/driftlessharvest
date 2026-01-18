const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkRole } = require('../middleware/auth');

// GET /api/products (Public) - List ACTIVE products
router.get('/products', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products WHERE is_active = 1 AND is_archived = 0 AND deleted_at IS NULL').all();
        products.forEach(p => {
            try { p.tags = JSON.parse(p.tags) } catch (e) { p.tags = [] }
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Admin product routes have been extracted to server/routes/admin/products.routes.js
// Box-templates routes have been extracted to server/routes/admin/box-templates.routes.js

// ----------------------------------------------------
// CATEGORIES
// ----------------------------------------------------

// GET /api/categories
router.get('/categories', (req, res) => {
    try {
        const cats = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
        res.json(cats);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// POST /api/categories
router.post('/categories', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const { name } = req.body;
        const info = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, 99)').run(name);
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// DELETE /api/categories/:id
router.delete('/categories/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ----------------------------------------------------
// BOX BUILDER
// ----------------------------------------------------

// GET /api/boxes/build
router.get('/boxes/build', (req, res) => {
    try {
        const { household_size, diet, avoid } = req.query;
        const allProducts = db.prepare('SELECT * FROM products').all();

        // Parse preferences
        const avoidList = (avoid || '').split(',')
            .map(s => s.trim().toLowerCase())
            .filter(s => s !== '');

        // Filter Products
        let safeProducts = allProducts.filter(p => {
            const pTags = JSON.parse(p.tags || '[]').map(t => t.toLowerCase());
            const pName = p.name.toLowerCase();

            // Filter Avoids
            const isAvoided = avoidList.some(a => pName.includes(a) || pTags.includes(a));
            if (isAvoided) return false;

            return true;
        });

        // Box Logic (Simplified for Prototype)
        const sizeMultiplier = household_size === '3-4' ? 1.5 : (household_size === '5+' ? 2 : 1);

        // Simple random selection for variety
        const baseItems = safeProducts.slice(0, 5).map(p => ({
            ...p,
            qty: Math.ceil(1 * sizeMultiplier),
            tags: JSON.parse(p.tags)
        }));

        res.json({
            box_id: 'custom-' + Date.now(),
            items: baseItems,
            total_price: baseItems.reduce((sum, i) => sum + (i.price * i.qty), 0)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to build box' });
    }
});

module.exports = router;

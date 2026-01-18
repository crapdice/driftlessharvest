/**
 * Admin Product Routes
 * 
 * Extracted from product.routes.js
 * Handles all /admin/products/* endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { checkRole } = require('../../middleware/auth');

// GET /api/admin/products - List ALL products (non-archived)
router.get('/admin/products', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products WHERE is_archived = 0 AND deleted_at IS NULL').all();
        products.forEach(p => { try { p.tags = JSON.parse(p.tags) } catch (e) { p.tags = [] } });
        res.json(products);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// POST /api/admin/products - Create product
router.post('/admin/products', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const { name, category, price, image_url, tags, stock, is_active, farm_id } = req.body;

        const info = db.prepare(`
            INSERT INTO products (name, category, price, image_url, tags, stock, is_active, farm_id)
            VALUES (@name, @category, @price, @image_url, @tags, @stock, @is_active, @farm_id)
        `).run({
            name, category, price, image_url,
            tags: JSON.stringify(tags || []),
            stock: parseInt(stock) || 0,
            is_active: is_active === undefined ? 1 : (is_active ? 1 : 0),
            farm_id: farm_id || null
        });

        res.json({ success: true, id: info.lastInsertRowid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// GET /api/admin/products/archived - List archived products
router.get('/admin/products/archived', checkRole(['admin', 'super_admin']), (req, res) => {
    console.log(`[Product] GET /admin/products/archived called by ${req.user.email}`);
    try {
        const products = db.prepare('SELECT * FROM products WHERE is_archived = 1').all();
        products.forEach(p => { try { p.tags = JSON.parse(p.tags) } catch (e) { p.tags = [] } });
        res.json(products);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/products/:id - Single product
router.get('/admin/products/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        try { product.tags = JSON.parse(product.tags); } catch (e) { product.tags = []; }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// PUT /api/admin/products/:id - Update product
router.put('/admin/products/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const id = req.params.id;

        // Fetch existing product
        const current = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        if (!current) return res.status(404).json({ error: 'Product not found' });

        // Merge existing with new data
        const isActive = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : current.is_active;
        const name = req.body.name || current.name;
        const category = req.body.category || current.category;
        const price = req.body.price !== undefined ? req.body.price : current.price;
        const image_url = req.body.image_url || current.image_url;
        const farm_id = req.body.farm_id !== undefined ? req.body.farm_id : current.farm_id;
        let tagsStr = current.tags;
        if (req.body.tags) {
            tagsStr = JSON.stringify(req.body.tags);
        }
        const stock = req.body.stock !== undefined ? parseInt(req.body.stock) : current.stock;

        db.prepare(`
            UPDATE products 
            SET name = @name, category = @category, price = @price, stock = @stock, 
                image_url = @image_url, tags = @tags, is_active = @isActive, farm_id = @farm_id
            WHERE id = @id
        `).run({
            id, name, category, price, stock,
            image_url, tags: tagsStr, isActive, farm_id
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/admin/products/:id - Soft delete (archive)
router.delete('/admin/products/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        db.prepare('UPDATE products SET is_archived = 1, is_active = 0, stock = 0 WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to archive product' });
    }
});

// POST /api/admin/products/:id/restore - Restore from archive
router.post('/admin/products/:id/restore', checkRole(['admin', 'super_admin']), (req, res) => {
    console.log(`[Product] Restore request for ${req.params.id}`);
    try {
        db.prepare('UPDATE products SET is_archived = 0, deleted_at = NULL WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error("Restore failed", err);
        res.status(500).json({ error: 'Failed to restore product' });
    }
});

// DELETE /api/admin/products/:id/permanent - Hard delete
router.delete('/admin/products/:id/permanent', checkRole(['admin', 'super_admin']), (req, res) => {
    console.log(`[Product] Permanent Delete request for ${req.params.id}`);
    try {
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error("Perm Delete failed", err);
        res.status(500).json({ error: 'Failed to permanently delete product' });
    }
});

module.exports = router;

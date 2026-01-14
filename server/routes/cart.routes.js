const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const jwt = require('jsonwebtoken'); // Need this to manually verify if middleware removed

// POST /api/cart/sync (Supports Auth & Guest)
router.post('/cart/sync', (req, res) => {
    try {
        const { items, guestId } = req.body;
        let email = null;
        let isGuest = false;

        // 1. Try Token
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
                    email = user.email;
                } catch (e) { }
            }
        }

        // 2. Fallback to Guest
        if (!email) {
            if (guestId) {
                email = `guest_${guestId}`;
                isGuest = true;
            } else {
                return res.status(200).json({ success: false, msg: 'No user or guest ID' });
            }
        }

        // Upsert
        // Note: guests use 'guest_ID' as email key.
        const exists = db.prepare('SELECT user_email FROM active_carts WHERE user_email = ?').get(email);
        if (exists) {
            db.prepare('UPDATE active_carts SET items = ?, updated_at = ? WHERE user_email = ?')
                .run(JSON.stringify(items || []), new Date().toISOString(), email);
        } else {
            db.prepare('INSERT INTO active_carts (user_email, items, updated_at) VALUES (?, ?, ?)')
                .run(email, JSON.stringify(items || []), new Date().toISOString());
        }
        res.json({ success: true });
    } catch (e) {
        console.error("Cart Sync Failed", e);
        res.status(200).json({ success: false });
    }
});

/*
  INVENTORY CHECK APIs
  Stock is now checked here but RESERVED only at payment/checkout.
*/
router.post('/cart/check-stock', (req, res) => {
    const { productId, qty, currentCartQty } = req.body;
    try {
        const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Check availability strictly against remaining stock
        // The requested 'qty' is the NEW addition.
        // 'currentCartQty' is what they already hold (which is not yet reserved in DB, so it counts against the DB stock).
        const totalRequested = qty + (currentCartQty || 0);

        if (product.stock >= totalRequested) {
            res.json({ success: true, available: product.stock });
        } else {
            res.status(409).json({
                error: 'Not enough stock',
                available: product.stock,
                maxAddable: Math.max(0, product.stock - (currentCartQty || 0))
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Deprecated: Release logic removed as we no longer reserve on add-to-cart
router.post('/cart/release', (req, res) => {
    res.json({ success: true }); // No-op for legacy safety
});


router.post('/cart/check-template-stock', (req, res) => {
    const { templateId } = req.body;

    // Fetch items from normalized table
    const items = db.prepare(`
        SELECT bi.product_id as id, bi.quantity as qty, p.name, p.stock, p.is_active, p.is_archived, p.deleted_at
        FROM box_items bi
        JOIN products p ON bi.product_id = p.id
        WHERE bi.box_template_id = ?
    `).all(templateId);

    if (items.length === 0) return res.status(404).json({ error: 'Template not found or empty' });

    for (const item of items) {
        if (item.deleted_at || item.is_archived || !item.is_active) {
            return res.status(409).json({ error: `Product unavailable: ${item.name}` });
        }
        if (item.stock < item.qty) {
            return res.status(409).json({ error: `Out of stock: ${item.name}. Only ${item.stock} left.` });
        }
    }

    res.json({ success: true, items });
});

router.post('/cart/release-template', (req, res) => {
    res.json({ success: true }); // No-op
});

module.exports = router;

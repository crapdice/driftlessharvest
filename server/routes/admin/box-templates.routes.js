/**
 * Admin Box-Templates Routes
 * 
 * Extracted from product.routes.js
 * Handles all /admin/box-templates/* endpoints plus public /box-templates
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { checkRole } = require('../../middleware/auth');

// Helper to attach items to templates
function attachBoxItems(templates) {
    if (!templates.length) return templates;

    const stmt = db.prepare(`
        SELECT bi.box_template_id, bi.quantity, p.id, p.name, p.stock, p.is_active, p.is_archived, p.deleted_at 
        FROM box_items bi
        JOIN products p ON bi.product_id = p.id
        WHERE bi.box_template_id IN (${templates.map(() => '?').join(',')})
    `);

    const items = stmt.all(...templates.map(t => t.id));

    // Group by box_id
    const itemMap = {};
    items.forEach(i => {
        if (!itemMap[i.box_template_id]) itemMap[i.box_template_id] = [];

        // Check component status
        const isUnavailable = i.deleted_at || i.stock < i.quantity || i.is_archived || !i.is_active;

        itemMap[i.box_template_id].push({
            id: i.id,
            name: i.name,
            qty: i.quantity,
            stock: i.stock,
            is_active: i.is_active,
            is_archived: i.is_archived,
            deleted_at: i.deleted_at,
            is_unavailable: !!isUnavailable,
            status_reason: i.deleted_at ? 'deleted' : (i.stock < i.quantity ? 'out_of_stock' : 'inactive')
        });
    });

    // Attach
    templates.forEach(t => {
        t.items = itemMap[t.id] || [];
        // Calculate box status based on components
        t.out_of_stock = t.items.some(i => i.is_unavailable);
    });

    return templates;
}

// GET /api/box-templates (Public)
router.get('/box-templates', (req, res) => {
    try {
        let templates = db.prepare('SELECT * FROM box_templates WHERE is_active = 1').all();
        templates = attachBoxItems(templates);
        res.json(templates);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/admin/box-templates (Admin)
router.get('/admin/box-templates', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        let templates = db.prepare('SELECT * FROM box_templates').all();
        templates = attachBoxItems(templates);
        res.json(templates);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/admin/box-templates
router.post('/admin/box-templates', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const { name, description, price, items, image_url, is_active } = req.body;

        const insertBox = db.prepare('INSERT INTO box_templates (name, description, base_price, items, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?)');
        const insertItem = db.prepare('INSERT INTO box_items (box_template_id, product_id, quantity) VALUES (?, ?, ?)');

        let newId;
        const txn = db.transaction(() => {
            const info = insertBox.run(name, description, price, '[]', image_url || '', is_active === undefined ? 1 : (is_active ? 1 : 0));
            newId = info.lastInsertRowid;

            if (Array.isArray(items)) {
                for (const item of items) {
                    const pid = item.product_id || item.id || item.productId;
                    const qty = item.qty || item.quantity || 1;
                    if (pid) insertItem.run(newId, pid, qty);
                }
            }
        });

        txn();
        res.json({ success: true, id: newId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    }
});

// PUT /api/admin/box-templates/:id
router.put('/admin/box-templates/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const { name, description, price, items, image_url, is_active } = req.body;
        const id = req.params.id;

        const updateBox = db.prepare(`
            UPDATE box_templates 
            SET name = @name, description = @description, base_price = @price, image_url = @image_url, is_active = @is_active
            WHERE id = @id
        `);
        const deleteItems = db.prepare('DELETE FROM box_items WHERE box_template_id = ?');
        const insertItem = db.prepare('INSERT INTO box_items (box_template_id, product_id, quantity) VALUES (?, ?, ?)');

        const txn = db.transaction(() => {
            updateBox.run({
                id, name, description, price,
                image_url: image_url || '',
                is_active: is_active === undefined ? 1 : (is_active ? 1 : 0)
            });

            deleteItems.run(id);

            if (Array.isArray(items)) {
                for (const item of items) {
                    const pid = item.product_id || item.id || item.productId;
                    const qty = item.qty || item.quantity || 1;
                    if (pid) insertItem.run(id, pid, qty);
                }
            }
        });

        txn();
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// DELETE /api/admin/box-templates/:id
router.delete('/admin/box-templates/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const deleteBox = db.prepare('DELETE FROM box_templates WHERE id = ?');
        const deleteItems = db.prepare('DELETE FROM box_items WHERE box_template_id = ?');

        db.transaction(() => {
            deleteItems.run(req.params.id);
            deleteBox.run(req.params.id);
        })();

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;

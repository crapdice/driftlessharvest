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

// POST /api/admin/products/:id/restore (Restore from Archive)
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

// DELETE /api/admin/products/:id/permanent (Hard Delete)
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

// GET /api/admin/products (Admin) - List ALL products
router.get('/admin/products', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products WHERE is_archived = 0 AND deleted_at IS NULL').all();
        products.forEach(p => { try { p.tags = JSON.parse(p.tags) } catch (e) { p.tags = [] } });
        res.json(products);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// POST /api/admin/products
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

// GET /api/admin/products/archived (Fetch Archived)
router.get('/admin/products/archived', checkRole(['admin', 'super_admin']), (req, res) => {
    console.log(`[Product] GET /admin/products/archived called by ${req.user.email}`);
    try {
        const products = db.prepare('SELECT * FROM products WHERE is_archived = 1').all();
        products.forEach(p => { try { p.tags = JSON.parse(p.tags) } catch (e) { p.tags = [] } });
        res.json(products);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/products/:id - Fetch Single Product (Active or Archived)
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

// PUT /api/admin/products/:id
router.put('/admin/products/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const id = req.params.id;

        // 1. Fetch existing product
        const current = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        if (!current) return res.status(404).json({ error: 'Product not found' });

        // 2. Merge existing with new data
        // For Active Status: If req.body.is_active is present, use it. Else keep current.
        // Explicitly check for undefined because false is a valid value.
        const isActive = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : current.is_active;

        const name = req.body.name || current.name;
        const category = req.body.category || current.category;
        const price = req.body.price !== undefined ? req.body.price : current.price;
        const image_url = req.body.image_url || current.image_url;
        const farm_id = req.body.farm_id !== undefined ? req.body.farm_id : current.farm_id;

        // Tags: If provided, use stringify. If not, keep current DB value (which is a string)
        let tagsStr = current.tags;
        if (req.body.tags) {
            tagsStr = JSON.stringify(req.body.tags);
        }

        const stock = req.body.stock !== undefined ? parseInt(req.body.stock) : current.stock;

        db.prepare(`
      UPDATE products 
      SET name = @name, category = @category, price = @price, stock = @stock, image_url = @image_url, tags = @tags, is_active = @isActive, farm_id = @farm_id
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

// DELETE /api/admin/products/:id (Soft Delete / Archive)
router.delete('/admin/products/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        // Archive: Disable, zero stock, set is_archived. DO NOT set deleted_at (reserved for hard deletions).
        const now = new Date().toISOString();
        db.prepare('UPDATE products SET is_archived = 1, is_active = 0, stock = 0 WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to archive product' });
    }
});



// Routes moved to top


// ----------------------------------------------------
// BOX TEMPLATES
// ----------------------------------------------------

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
        // Filter out boxes that have unavailable items for public view? 
        // Or just show them as OOS? Let's show as OOS.
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

        // Validate items exist? (Optional but good)

        let newId;
        const txn = db.transaction(() => {
            // We keep 'items' column for legacy/read-fallback if needed, or empty array string
            const info = insertBox.run(name, description, price, '[]', image_url || '', is_active === undefined ? 1 : (is_active ? 1 : 0));
            newId = info.lastInsertRowid;

            if (Array.isArray(items)) {
                for (const item of items) {
                    const pid = item.product_id || item.id || item.productId; // Frontend might send different formats
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

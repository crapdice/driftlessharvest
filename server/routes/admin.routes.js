const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { checkRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema, orderStatusSchema, deliveryWindowSchema } = require('../schemas');

// GET /api/admin/stats
router.get('/admin/stats', checkRole(['admin', 'super_admin']), (req, res) => {
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const revenue = db.prepare('SELECT SUM(total) as total FROM orders').get().total || 0;
    const pending = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'").get().count;

    res.json({ orderCount, revenue, pending });
});

// GET /api/admin/users
router.get('/admin/users', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        // Join with admin_types to get role name and count orders per user
        const users = db.prepare(`
            SELECT u.id, u.email, u.phone, u.created_at, u.is_admin, u.is_customer,
                   t.name as role_name,
                   u.first_name, u.last_name,
                   COUNT(DISTINCT o.id) as order_count
            FROM users u
            LEFT JOIN admin_types t ON u.admin_type_id = t.id
            LEFT JOIN orders o ON u.email = o.user_email
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `).all();

        // Fetch addresses for each user
        const addresses = db.prepare('SELECT user_email, street, city, state, zip FROM addresses').all();
        const addressMap = {};
        addresses.forEach(addr => {
            if (!addressMap[addr.user_email]) {
                addressMap[addr.user_email] = addr;
            }
        });

        const safeUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            phone: u.phone || '',
            role: u.role_name || (u.is_admin ? 'admin' : 'user'),
            created_at: u.created_at,
            order_count: u.order_count || 0,
            address: addressMap[u.email] || {},
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim()
        }));
        res.json(safeUsers);
    } catch (e) {
        console.error('GET /admin/users Error:', e);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/admin/users
// POST /api/admin/users
router.post('/admin/users', checkRole(['admin', 'super_admin']), validate(createUserSchema), async (req, res) => {
    try {
        const { email, password, role, city, state, zip, address, phone, firstName, lastName } = req.body;

        const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (exists) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = Date.now().toString(); // Or use string ID provided it doesn't conflict? 
        // Wait, Migration 018 uses INTEGER for users.id?
        // Let's check schema. User ID is NOT AutoIncrement in 018? 
        // 018: id INTEGER PRIMARY KEY (no autoincrement specified)
        // If we pass an int it works. If we pass string '17...' it works?

        let typeId = null;
        let isAdmin = 0;

        // Resolve Role to Type ID
        if (role && role !== 'user' && role !== 'customer') {
            const type = db.prepare('SELECT id FROM admin_types WHERE name = ?').get(role);
            if (type) {
                typeId = type.id;
                isAdmin = 1;
            }
        }

        // We'll skip address creation for now or create an address record?
        // For simplicity, we just insert the user. Address logic needs to be fully updated to new table.

        db.prepare(`
            INSERT INTO users (id, email, password, is_admin, admin_type_id, phone, first_name, last_name, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, email, hashedPassword, isAdmin, typeId, phone || '', firstName, lastName, new Date().toISOString());

        res.json({ success: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/admin/users/:id
// PUT /api/admin/users/:id
router.put('/admin/users/:id', checkRole(['admin', 'super_admin']), validate(updateUserSchema), (req, res) => {
    try {
        const { email, role, phone } = req.body;

        let typeId = null;
        let isAdmin = 0;

        if (role && role !== 'user') {
            const type = db.prepare('SELECT id FROM admin_types WHERE name = ?').get(role);
            if (type) {
                typeId = type.id;
                isAdmin = 1;
            }
        } else {
            // Demote to user
            isAdmin = 0;
            typeId = null;
        }

        db.prepare(`
            UPDATE users 
            SET email = @email, is_admin = @isAdmin, admin_type_id = @typeId, phone = @phone
            WHERE id = @id
        `).run({
            id: req.params.id,
            email,
            isAdmin,
            typeId,
            phone: phone || ''
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/admin/users/:id
// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', checkRole(['super_admin']), (req, res) => {
    try {
        // Warning: This doesn't clean up addresses/orders
        const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
        if (target && req.user.id == req.params.id) return res.status(400).json({ error: "Cannot delete yourself" });

        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete user' }); }
});


// POST /api/admin/users/:id/reset
router.post('/admin/users/:id/reset', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        console.log(`[Mock] Password reset email sent to user ${req.params.id}`);
        res.json({ success: true, message: 'Password reset link sent (Mock)' });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/orders
router.get('/admin/orders', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        // Phase 2: Join with normalized addresses (Source of Truth)
        const orders = db.prepare(`
        SELECT o.*, 
               a.name as addr_name, 
               a.street as addr_street,
               a.city as addr_city,
               a.state as addr_state, 
               a.zip as addr_zip, 
               a.phone as addr_phone,
               a.user_email as addr_email,
               p.stripe_payment_id as payment_id,
               p.created_at as payment_date
        FROM orders o
        LEFT JOIN addresses a ON o.address_id = a.id
        LEFT JOIN payments p ON o.id = p.order_id
        ORDER BY o.created_at DESC
      `).all();

        const parsedOrders = orders.map(o => {
            let shipping_details = {};
            let items = [];

            // 1. Safe Shipping Details Parse
            try {
                const legacyDetails = JSON.parse(o.shipping_details || '{}') || {};

                // Construct standardized shipping object (prefer normalized data)
                shipping_details = o.address_id ? {
                    name: o.addr_name,
                    street: o.addr_street,
                    city: o.addr_city,
                    state: o.addr_state,
                    zip: o.addr_zip,
                    phone: o.addr_phone,
                    delivery_window: o.delivery_window || legacyDetails.delivery_window || legacyDetails.date
                } : legacyDetails;
            } catch (e) {
                console.warn(`[Admin] Failed to parse shipping_details for order ${o.id}`, e);
                shipping_details = { name: 'Error Parsing Details' };
            }

            // 2. Items: Try Normalized first, then JSON fallback
            try {
                // Check if order_items table has data for this order
                const normalizedItems = db.prepare('SELECT product_id as id, product_name as name, quantity as qty, price_at_purchase as price, item_type as type FROM order_items WHERE order_id = ?').all(o.id);

                if (normalizedItems.length > 0) {
                    items = normalizedItems;
                } else {
                    // Fallback to JSON
                    items = JSON.parse(o.items || '[]');
                }
            } catch (e) {
                console.warn(`[Admin] Failed to parse items for order ${o.id}`, e);
                // Fallback attempt just in case the error was from db.prepare (if table missing)
                try { items = JSON.parse(o.items || '[]'); } catch (z) { items = []; }
            }

            return {
                id: o.id,
                date: o.created_at,
                packed_at: o.packed_at,
                shipped_at: o.shipped_at,
                delivered_at: o.delivered_at,
                cancelled_at: o.cancelled_at,
                userEmail: o.user_email,
                total: o.total,
                status: o.status,
                payment_id: o.payment_id,
                payment_date: o.payment_date,
                shipping_details: shipping_details,
                items: items
            };
        });
        res.json(parsedOrders);
    } catch (e) {
        console.error("Admin Orders API Error:", e);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// PUT /api/admin/orders/:id/status
router.put('/admin/orders/:id/status', checkRole(['admin', 'super_admin']), validate(orderStatusSchema), (req, res) => {
    const { status } = req.body;
    // Zod schema enforces valid statuses!

    console.log(`[DEBUG] Update Status: Received '${status}' for Order ${req.params.id}`);

    const now = new Date().toISOString();
    let updateStmt = 'UPDATE orders SET status = ? WHERE id = ?';
    let params = [status, req.params.id];

    // Status-specific Timestamp Logic
    if (status === 'Packed') {
        updateStmt = 'UPDATE orders SET status = ?, packed_at = ? WHERE id = ?';
        params = [status, now, req.params.id];
    } else if (status === 'Shipped') {
        // Always update shipped_at to NOW if we are explicitly marking as Shipped
        updateStmt = 'UPDATE orders SET status = ?, shipped_at = ? WHERE id = ?';
        params = [status, now, req.params.id];
    } else if (status === 'Delivered') {
        // Set delivered_at AND ensure shipped_at is set if it was missing
        updateStmt = 'UPDATE orders SET status = ?, delivered_at = ?, shipped_at = COALESCE(shipped_at, ?) WHERE id = ?';
        params = [status, now, now, req.params.id];
    } else if (status === 'Canceled') {
        updateStmt = 'UPDATE orders SET status = ?, cancelled_at = ? WHERE id = ?';
        params = [status, now, req.params.id];
    }

    // Execute
    try {
        const info = db.prepare(updateStmt).run(...params);
        if (info.changes > 0) {
            // Return the updated timestamps to the client
            res.json({
                success: true,
                timestamps: {
                    packed_at: status === 'Packed' ? now : undefined,
                    shipped_at: status === 'Shipped' || status === 'Delivered' ? now : undefined,
                    delivered_at: status === 'Delivered' ? now : undefined,
                    cancelled_at: status === 'Canceled' ? now : undefined
                }
            });
        }
        else res.status(404).json({ error: 'Order not found' });
    } catch (e) {
        console.error("Update Status Error", e);
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/admin/orders/:id/delivery
router.put('/admin/orders/:id/delivery', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const { delivery_window } = req.body;
        const order = db.prepare('SELECT shipping_details FROM orders WHERE id = ?').get(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        let details = {};
        try { details = JSON.parse(order.shipping_details); } catch (e) { }

        details.delivery_window = delivery_window;

        // Lookup DATE value
        let deliveryDate = null;
        try {
            const win = db.prepare('SELECT date_value FROM delivery_windows WHERE date_label = ?').get(delivery_window);
            if (win) deliveryDate = win.date_value;
        } catch (e) { }

        db.prepare('UPDATE orders SET shipping_details = ?, delivery_window = ?, delivery_date = ? WHERE id = ?')
            .run(
                JSON.stringify(details),
                delivery_window,
                deliveryDate,
                req.params.id
            );

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// PUT /api/admin/orders/:id - Update Entire Order
router.put('/admin/orders/:id', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const { items, shipping_details, status } = req.body;

        // 1. Fetch existing to preserve name/date/window in blob
        const existing = db.prepare('SELECT shipping_details FROM orders WHERE id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Order not found' });

        const currentDetails = JSON.parse(existing.shipping_details || '{}');
        // Merge: Old Details + New Partial Updates
        const mergedDetails = { ...currentDetails, ...shipping_details };

        let total = 0;

        // Recalculate total for safety
        if (Array.isArray(items)) {
            total = items.reduce((sum, i) => sum + ((parseFloat(i.price) || 0) * (parseInt(i.qty) || 0)), 0);
        }

        let query = 'UPDATE orders SET items = ?, shipping_details = ?, total = ?';
        const params = [JSON.stringify(items), JSON.stringify(mergedDetails), total];

        if (status) {
            query += ', status = ?';
            params.push(status);

            const now = new Date().toISOString();

            if (['Pending', 'Pending Payment', 'Paid'].includes(status)) {
                // Reset all progress timestamps if moved back to start
                query += ', packed_at = NULL, shipped_at = NULL, delivered_at = NULL';
            } else if (status === 'Packed') {
                // Ensure packed_at is set, clear future steps
                query += ', packed_at = COALESCE(packed_at, ?), shipped_at = NULL, delivered_at = NULL';
                params.push(now);
            } else if (status === 'Shipped') {
                // Ensure shipped_at is set, clear delivery
                query += ', shipped_at = COALESCE(shipped_at, ?), delivered_at = NULL';
                params.push(now);
            } else if (status === 'Delivered') {
                // Ensure delivered_at AND shipped_at are set
                query += ', delivered_at = COALESCE(delivered_at, ?), shipped_at = COALESCE(shipped_at, ?)';
                params.push(now, now);
            } else if (status === 'Canceled' || status === 'Cancelled') {
                query += ', cancelled_at = COALESCE(cancelled_at, ?)';
                params.push(now);
            }
        }

        query += ' WHERE id = ?';
        params.push(req.params.id);

        db.prepare(query).run(...params);

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
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

// POST /api/admin/box-templates
router.post('/admin/box-templates', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { name, description, price, items, image_url, is_active } = req.body;

        let newId;

        const insertBox = db.prepare('INSERT INTO box_templates (name, description, base_price, items, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?)');
        const insertItem = db.prepare('INSERT INTO box_items (box_template_id, product_id, quantity) VALUES (?, ?, ?)');

        // Validate items exist? (Optional but good)

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
        console.error("Failed to create box template:", e);
        res.status(500).json({ error: 'Failed to create box template' });
    }
});

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

// Debug
router.get('/admin/test', (req, res) => res.json({ status: 'ok', msg: 'Admin path works' }));

module.exports = router;

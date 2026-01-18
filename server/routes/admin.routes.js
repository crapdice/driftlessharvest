const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { userRepository } = require('../repositories');
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

// GET /api/admin/users
router.get('/admin/users', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        // Get all users with role info
        const users = db.prepare(`
            SELECT u.id, u.email, u.phone, u.created_at, u.admin_type_id,
                   t.name as role_name, t.display_name as role_display_name,
                   u.first_name, u.last_name,
                   COUNT(DISTINCT o.id) as order_count
            FROM users u
            LEFT JOIN admin_types t ON u.admin_type_id = t.id
            LEFT JOIN orders o ON u.email = o.user_email
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `).all();

        // Fetch addresses by user_id
        const addresses = db.prepare('SELECT user_id, street, city, state, zip FROM addresses').all();
        const addressMap = {};
        addresses.forEach(addr => {
            if (!addressMap[addr.user_id]) {
                addressMap[addr.user_id] = addr;
            }
        });

        const safeUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            phone: u.phone || '',
            role: u.role_name || 'customer',
            role_display: u.role_display_name || 'Customer',
            created_at: u.created_at,
            order_count: u.order_count || 0,
            address: addressMap[u.id] || {},
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            isAdmin: u.admin_type_id !== null
        }));
        res.json(safeUsers);
    } catch (e) {
        console.error('GET /admin/users Error:', e);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/admin/users
router.post('/admin/users', checkRole(['admin', 'super_admin']), validate(createUserSchema), async (req, res) => {
    try {
        const { email, password, role, city, state, zip, address, phone, firstName, lastName } = req.body;

        // Check if user exists via repository
        if (userRepository.emailExists(email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Resolve role to admin_type_id
        let adminTypeId = null;
        if (role && role !== 'user' && role !== 'customer') {
            const adminType = userRepository.getAdminType(role);
            if (adminType) {
                adminTypeId = adminType.id;
            }
        }

        // Create user via repository
        const user = userRepository.create({
            email,
            password,
            firstName,
            lastName,
            phone: phone || '',
            adminTypeId
        });

        // Create address if provided
        if (address || city || state || zip) {
            const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';
            db.prepare(`
                INSERT INTO addresses (user_id, name, street, city, state, zip, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `).run(user.id, fullName, address || '', city || '', state || '', zip || '');
        }

        res.json({ success: true, id: user.id });
    } catch (err) {
        console.error('POST /admin/users Error:', err);
        res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
});

// PUT /api/admin/users/:id
router.put('/admin/users/:id', checkRole(['admin', 'super_admin']), validate(updateUserSchema), (req, res) => {
    try {
        const { email, role, phone, address, city, state, zip, firstName, lastName } = req.body;
        const userId = parseInt(req.params.id, 10);

        // Resolve role to admin_type_id
        let adminTypeId = null;
        if (role && role !== 'user' && role !== 'customer') {
            const adminType = userRepository.getAdminType(role);
            if (adminType) {
                adminTypeId = adminType.id;
            }
        }

        // Update user via repository
        userRepository.update(userId, {
            email,
            firstName,
            lastName,
            phone: phone || '',
            adminTypeId
        });

        // Handle address update/creation if address fields are provided
        if (address || city || state || zip) {
            const user = userRepository.findById(userId);
            const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';

            const existingAddress = db.prepare('SELECT id FROM addresses WHERE user_id = ?').get(userId);

            if (existingAddress) {
                db.prepare(`
                    UPDATE addresses 
                    SET name = ?, street = ?, city = ?, state = ?, zip = ?
                    WHERE user_id = ?
                `).run(fullName, address || '', city || '', state || '', zip || '', userId);
            } else {
                db.prepare(`
                    INSERT INTO addresses (user_id, name, street, city, state, zip, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                `).run(userId, fullName, address || '', city || '', state || '', zip || '');
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('PUT /admin/users/:id Error:', err);
        res.status(500).json({ error: 'Failed to update user', details: err.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', checkRole(['super_admin']), (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);

        // Can't delete yourself
        if (req.user.id === userId) {
            return res.status(400).json({ error: "Cannot delete yourself" });
        }

        // Check user exists
        const user = userRepository.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user and related data atomically
        const result = userRepository.deleteWithRelated(userId);
        res.json({ success: true, deleted: result.deleted });
    } catch (err) {
        console.error('DELETE /admin/users/:id Error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
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

        // Check which columns exist in orders table
        const cols = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
        const hasDeliveryWindow = cols.includes('delivery_window');
        const hasDeliveryDate = cols.includes('delivery_date');

        if (!hasDeliveryWindow && !hasDeliveryDate) {
            console.error('[Delivery Reschedule] Neither delivery_window nor delivery_date columns exist');
            return res.status(500).json({
                error: 'Database schema missing delivery columns. Please run migrations.'
            });
        }

        const order = db.prepare('SELECT shipping_details FROM orders WHERE id = ?').get(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        let details = {};
        try { details = JSON.parse(order.shipping_details || '{}'); } catch (e) {
            console.warn('[Delivery Reschedule] Failed to parse shipping_details:', e);
        }

        details.delivery_window = delivery_window;

        // Lookup DATE value if we have delivery_date column
        let deliveryDate = null;
        if (hasDeliveryDate) {
            try {
                const win = db.prepare('SELECT date_value FROM delivery_windows WHERE date_label = ?').get(delivery_window);
                if (win) deliveryDate = win.date_value;
            } catch (e) {
                console.error('[Delivery Reschedule] Error looking up delivery window:', e);
            }
        }

        // Build UPDATE query based on available columns
        let updateQuery = 'UPDATE orders SET shipping_details = ?';
        const params = [JSON.stringify(details)];

        if (hasDeliveryWindow) {
            updateQuery += ', delivery_window = ?';
            params.push(delivery_window);
        }

        if (hasDeliveryDate) {
            updateQuery += ', delivery_date = ?';
            params.push(deliveryDate);
        }

        updateQuery += ' WHERE id = ?';
        params.push(req.params.id);

        db.prepare(updateQuery).run(...params);

        res.json({ success: true });
    } catch (e) {
        console.error('[Delivery Reschedule] Error:', e);
        res.status(500).json({ error: 'Failed to reschedule delivery', details: e.message });
    }
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

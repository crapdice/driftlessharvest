/**
 * Admin Utilities Routes
 * 
 * Super-admin utilities for database management, seeding, and cleanup.
 * Handles all /admin/utilities/* endpoints.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { userRepository } = require('../../repositories');
const fs = require('fs');
const path = require('path');
const { checkRole } = require('../../middleware/auth');

const { SEED_USERS } = require('../../db/seed_data');

// POST /admin/utilities/seed-users
router.post('/admin/utilities/seed-users', checkRole(['super_admin']), (req, res) => {
    try {
        let usersCreated = 0;
        let addressesCreated = 0;

        const seedTransaction = db.transaction(() => {
            const insertAddress = db.prepare(`
                INSERT INTO addresses (
                    user_id, user_email, name, street, city, state, zip, phone, type, is_default, first_name, last_name
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const userData of SEED_USERS) {
                // Skip if user already exists
                if (userRepository.emailExists(userData.email)) continue;

                // password is included in SEED_USERS (e.g. 'password123')
                const user = userRepository.create(userData);
                usersCreated++;

                // Create a default shipping address for the user
                insertAddress.run(
                    user.id,
                    user.email,
                    `${userData.firstName} ${userData.lastName}`,
                    userData.street,
                    userData.city,
                    userData.state,
                    userData.zip,
                    userData.phone,
                    'shipping',
                    1, // is_default
                    userData.firstName,
                    userData.lastName
                );
                addressesCreated++;
            }
        });

        seedTransaction();

        res.json({
            success: true,
            created: {
                users: usersCreated,
                addresses: addressesCreated
            }
        });
    } catch (error) {
        console.error('[Utilities] Seed users error:', error);
        res.status(500).json({ error: 'Failed to seed users', details: error.message });
    }
});

// POST /admin/utilities/seed-orders
router.post('/admin/utilities/seed-orders', checkRole(['super_admin']), (req, res) => {
    try {
        const users = db.prepare('SELECT id, email FROM users WHERE admin_type_id IS NULL').all();
        const products = db.prepare('SELECT id, name, price FROM products WHERE is_active = 1').all();
        const templates = db.prepare('SELECT id, name, base_price FROM box_templates WHERE is_active = 1').all();
        const windows = db.prepare('SELECT * FROM delivery_windows WHERE is_active = 1').all();

        if (users.length === 0) {
            return res.status(400).json({ error: 'No customers found to seed orders for. Please seed users first.' });
        }
        if (products.length === 0 && templates.length === 0) {
            return res.status(412).json({ error: 'No products or boxes found. Please ensure catalog is seeded.' });
        }
        if (windows.length === 0) {
            return res.status(412).json({ error: 'No delivery windows found. Create windows in Configuration > Delivery first.' });
        }

        let ordersCreated = 0;
        let itemsCreated = 0;

        const seedTransaction = db.transaction(() => {
            const insertOrder = db.prepare(`
                INSERT INTO orders (user_id, user_email, total, status, delivery_window, items, address_id, delivery_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const insertOrderItem = db.prepare(`
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            // Seed up to 100 random orders spread across users for better data density
            const numOrders = Math.min(100, users.length * 5);

            for (let i = 0; i < numOrders; i++) {
                const user = users[Math.floor(Math.random() * users.length)];
                // Find a default address for this user
                const address = db.prepare('SELECT id FROM addresses WHERE user_id = ? AND is_default = 1').get(user.id);
                const window = windows[Math.floor(Math.random() * windows.length)];

                const orderItemsList = [];
                let orderTotal = 0;

                // Pick 1-4 random products
                const numProds = Math.floor(Math.random() * 4) + 1;
                const shuffledProds = [...products].sort(() => 0.5 - Math.random());
                const selectedProds = shuffledProds.slice(0, numProds);

                selectedProds.forEach(p => {
                    const qty = Math.floor(Math.random() * 3) + 1;
                    orderItemsList.push({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        qty: qty,
                        type: 'product'
                    });
                    orderTotal += p.price * qty;
                });

                // 40% chance of adding a box template
                if (templates.length > 0 && Math.random() > 0.6) {
                    const template = templates[Math.floor(Math.random() * templates.length)];
                    orderItemsList.push({
                        id: template.id,
                        name: template.name,
                        price: template.base_price,
                        qty: 1,
                        type: 'box'
                    });
                    orderTotal += template.base_price;
                }

                const windowStr = `${window.date_label} (${window.start_time} - ${window.end_time})`;

                const orderResult = insertOrder.run(
                    user.id,
                    user.email,
                    orderTotal,
                    'Paid',
                    windowStr,
                    JSON.stringify(orderItemsList),
                    address ? address.id : null,
                    window.date_value
                );

                const orderId = orderResult.lastInsertRowid;
                ordersCreated++;

                // Add individual items
                for (const item of orderItemsList) {
                    insertOrderItem.run(
                        orderId,
                        item.type === 'product' ? item.id : null,
                        item.name,
                        item.qty,
                        item.price,
                        item.type
                    );
                    itemsCreated++;
                }
            }
        });

        seedTransaction();

        res.json({
            success: true,
            created: {
                orders: ordersCreated,
                orderItems: itemsCreated
            }
        });
    } catch (error) {
        console.error('[Utilities] Seed orders error:', error);
        res.status(500).json({ error: 'Failed to seed orders', details: error.message });
    }
});

// POST /admin/utilities/clean-database
router.post('/admin/utilities/clean-database', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting database cleanup...');
        const payments = db.prepare('DELETE FROM payments').run();
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const carts = db.prepare('DELETE FROM active_carts').run();
        const addresses = db.prepare('DELETE FROM addresses').run();
        const users = userRepository.deleteAllExcept('admin@driftlessharvest.com');
        res.json({
            success: true,
            deleted: {
                payments: payments.changes,
                orderItems: orderItems.changes,
                orders: orders.changes,
                carts: carts.changes,
                addresses: addresses.changes,
                users
            }
        });
    } catch (error) {
        console.error('[Utilities] Cleanup error:', error);
        res.status(500).json({ error: 'Failed to clean database', details: error.message });
    }
});

// POST /admin/utilities/clean-orders
router.post('/admin/utilities/clean-orders', checkRole(['super_admin']), (req, res) => {
    try {
        const payments = db.prepare('DELETE FROM payments').run();
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const carts = db.prepare('DELETE FROM active_carts').run();
        res.json({
            success: true,
            deleted: { payments: payments.changes, orderItems: orderItems.changes, orders: orders.changes, carts: carts.changes }
        });
    } catch (error) {
        console.error('[Utilities] Clean orders error:', error);
        res.status(500).json({ error: 'Failed to clean orders', details: error.message });
    }
});

// POST /admin/utilities/clean-users
router.post('/admin/utilities/clean-users', checkRole(['super_admin']), (req, res) => {
    try {
        const result = userRepository.deleteAllCustomersWithRelated();
        res.json({ success: true, deleted: result });
    } catch (error) {
        console.error('[Utilities] Clean users error:', error);
        res.status(500).json({ error: 'Failed to clean users', details: error.message });
    }
});

// POST /admin/utilities/clean-analytics
router.post('/admin/utilities/clean-analytics', checkRole(['super_admin']), (req, res) => {
    try {
        const result = db.prepare('DELETE FROM analytics_events').run();
        res.json({ success: true, deleted: { analytics_events: result.changes } });
    } catch (error) {
        console.error('[Utilities] Clean analytics error:', error);
        res.status(500).json({ error: 'Failed to clean analytics', details: error.message });
    }
});

// POST /admin/utilities/clean-delivery-windows
router.post('/admin/utilities/clean-delivery-windows', checkRole(['super_admin']), (req, res) => {
    try {
        const result = db.prepare('DELETE FROM delivery_windows').run();
        res.json({ success: true, deleted: { delivery_windows: result.changes } });
    } catch (error) {
        console.error('[Utilities] Clean delivery windows error:', error);
        res.status(500).json({ error: 'Failed to clean delivery windows', details: error.message });
    }
});

// GET /admin/utilities/verify-database
router.get('/admin/utilities/verify-database', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        res.json({
            success: true,
            counts: {
                users: userRepository.count(),
                admins: db.prepare("SELECT count(*) as c FROM users WHERE admin_type_id IS NOT NULL").get().c,
                orders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count,
                products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
                categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
                farms: db.prepare('SELECT COUNT(*) as count FROM farms').get().count
            }
        });
    } catch (error) {
        console.error('[Utilities] Verify error:', error);
        res.status(500).json({ error: 'Failed to verify database', details: error.message });
    }
});

// POST /admin/utilities/clean-temp-files
router.post('/admin/utilities/clean-temp-files', checkRole(['super_admin']), (req, res) => {
    try {
        res.json({ success: true, deleted: 0 });
    } catch (error) {
        console.error('[Utilities] Clean temp files error:', error);
        res.status(500).json({ error: 'Failed to clean temp files', details: error.message });
    }
});

// GET /admin/utilities/query/:table
router.get('/admin/utilities/query/:table', checkRole(['admin', 'super_admin']), (req, res) => {
    const { table } = req.params;
    const allowedTables = [
        'users', 'orders', 'products', 'delivery_windows', 'addresses',
        'categories', 'farms', 'order_items', 'active_carts', 'payments',
        'box_templates', 'box_items', 'analytics_events', 'launch_signups'
    ];
    if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });
    try {
        const results = db.prepare(`SELECT * FROM ${table} LIMIT 100`).all();
        res.json({ success: true, results, count: results.length });
    } catch (error) {
        console.error('[Utilities Query Error]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

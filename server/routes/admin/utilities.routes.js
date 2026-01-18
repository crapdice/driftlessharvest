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

// POST /admin/utilities/seed-users
router.post('/admin/utilities/seed-users', checkRole(['super_admin']), (req, res) => {
    try {
        const testUsers = [
            { email: 'customer1@test.com', password: 'password123', firstName: 'John', lastName: 'Doe', phone: '5551234567' },
            { email: 'customer2@test.com', password: 'password123', firstName: 'Jane', lastName: 'Smith', phone: '5552345678' },
            { email: 'customer3@test.com', password: 'password123', firstName: 'Bob', lastName: 'Wilson', phone: '5553456789' },
            { email: 'customer4@test.com', password: 'password123', firstName: 'Alice', lastName: 'Brown', phone: '5554567890' },
            { email: 'customer5@test.com', password: 'password123', firstName: 'Charlie', lastName: 'Davis', phone: '5555678901' }
        ];

        let usersCreated = 0;
        let addressesCreated = 0;

        const seedTransaction = db.transaction(() => {
            const insertAddress = db.prepare(`
                INSERT INTO addresses (user_id, user_email, name, street, city, state, zip, phone, type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const userData of testUsers) {
                // Skip if user already exists
                if (userRepository.emailExists(userData.email)) continue;

                const user = userRepository.create(userData);
                usersCreated++;

                // Create a default shipping address for the user
                insertAddress.run(
                    user.id,
                    user.email,
                    `${userData.firstName} ${userData.lastName}`,
                    '123 Test Street',
                    'Viroqua',
                    'WI',
                    '54665',
                    userData.phone,
                    'shipping'
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
        const users = db.prepare('SELECT id, email FROM users WHERE admin_type_id IS NULL LIMIT 5').all();
        const products = db.prepare('SELECT id, name, price FROM products LIMIT 5').all();

        if (users.length === 0) {
            return res.status(400).json({ error: 'No customers found to seed orders for. Please seed users first.' });
        }
        if (products.length === 0) {
            return res.status(412).json({ error: 'No products found. Please ensure catalog is seeded.' });
        }

        let ordersCreated = 0;
        let itemsCreated = 0;

        const seedTransaction = db.transaction(() => {
            const insertOrder = db.prepare(`
                INSERT INTO orders (user_id, user_email, total, status, delivery_window, items)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            const insertOrderItem = db.prepare(`
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            const insertAddress = db.prepare(`
                INSERT INTO addresses (user_id, user_email, name, street, city, state, zip, phone, type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const user of users) {
                // Create a basic address for the user
                const addr = insertAddress.run(
                    user.id, user.email, 'Seed User', '123 Main St', 'Viroqua', 'WI', '54665', '555-0100', 'shipping'
                );

                // Create an order
                const total = products.reduce((sum, p) => sum + p.price, 0);
                const orderResult = insertOrder.run(
                    user.id,
                    user.email,
                    total,
                    'Paid',
                    'Friday 4pm-6pm',
                    JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price, qty: 1 })))
                );
                const orderId = orderResult.lastInsertRowid;
                ordersCreated++;

                // Add items
                for (const product of products) {
                    insertOrderItem.run(orderId, product.id, product.name, 1, product.price, 'product');
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

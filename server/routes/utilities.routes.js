const express = require('express');
const router = express.Router();
const db = require('../db');
const { userRepository } = require('../repositories');
const fs = require('fs');
const path = require('path');
const { checkRole } = require('../middleware/auth');

// POST /api/admin/utilities/clean-database
router.post('/admin/utilities/clean-database', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting database cleanup...');

        // Delete in correct order (respecting foreign keys)
        const payments = db.prepare('DELETE FROM payments').run();
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const carts = db.prepare('DELETE FROM active_carts').run();
        const addresses = db.prepare('DELETE FROM addresses').run();
        const users = userRepository.deleteAllExcept('admin@driftlessharvest.com');

        console.log('[Utilities] Database cleanup complete');

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

// POST /api/admin/utilities/clean-orders
router.post('/admin/utilities/clean-orders', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting orders cleanup...');

        // Delete order-related data only
        const payments = db.prepare('DELETE FROM payments').run();
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const carts = db.prepare('DELETE FROM active_carts').run();

        console.log('[Utilities] Orders cleanup complete');

        res.json({
            success: true,
            deleted: {
                payments: payments.changes,
                orderItems: orderItems.changes,
                orders: orders.changes,
                carts: carts.changes
            }
        });
    } catch (error) {
        console.error('[Utilities] Clean orders error:', error);
        res.status(500).json({ error: 'Failed to clean orders', details: error.message });
    }
});

// POST /api/admin/utilities/clean-users
router.post('/admin/utilities/clean-users', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting users cleanup...');

        // Delete customer users and all their related data atomically
        const result = userRepository.deleteAllCustomersWithRelated();

        console.log('[Utilities] Users cleanup complete');

        res.json({
            success: true,
            deleted: result
        });
    } catch (error) {
        console.error('[Utilities] Clean users error:', error);
        res.status(500).json({ error: 'Failed to clean users', details: error.message });
    }
});

// POST /api/admin/utilities/seed-users
router.post('/admin/utilities/seed-users', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting user seeding...');

        // Define test users
        const testUsers = [
            { email: 'customer1@test.com', password: 'password123', firstName: 'John', lastName: 'Doe', phone: '5551234567' },
            { email: 'customer2@test.com', password: 'password123', firstName: 'Jane', lastName: 'Smith', phone: '5552345678' },
            { email: 'customer3@test.com', password: 'password123', firstName: 'Bob', lastName: 'Johnson', phone: '5553456789' },
            { email: 'customer4@test.com', password: 'password123', firstName: 'Alice', lastName: 'Williams', phone: '5554567890' },
            { email: 'customer5@test.com', password: 'password123', firstName: 'Charlie', lastName: 'Brown', phone: '5555678901' }
        ];

        // Seed users using repository
        const userResult = userRepository.seedUsers(testUsers);

        // Create addresses for users who don't have one
        let addressesCreated = 0;
        const customers = userRepository.listCustomers();
        customers.forEach((user, index) => {
            const existingAddr = db.prepare('SELECT id FROM addresses WHERE user_id = ?').get(user.id);
            if (!existingAddr) {
                db.prepare(`
                    INSERT INTO addresses (user_id, name, street, city, state, zip, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                `).run(
                    user.id,
                    `${user.first_name || 'Test'} ${user.last_name || 'User'}`,
                    `${100 + index} Main St`,
                    'Madison',
                    'WI',
                    `5370${index}`
                );
                addressesCreated++;
            }
        });

        console.log('[Utilities] User seeding complete');

        res.json({
            success: true,
            created: {
                users: userResult.created,
                usersSkipped: userResult.skipped,
                addresses: addressesCreated
            },
            totalCustomers: userRepository.countCustomers()
        });
    } catch (error) {
        console.error('[Utilities] Seed users error:', error);
        res.status(500).json({ error: 'Failed to seed users', details: error.message });
    }
});

// POST /api/admin/utilities/seed-orders
router.post('/admin/utilities/seed-orders', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting order seeding...');

        const customers = userRepository.listCustomers();
        if (customers.length === 0) {
            return res.status(400).json({ error: 'No customers found. Please seed users first.' });
        }

        const products = db.prepare('SELECT id, name, price FROM products WHERE is_active = 1 LIMIT 10').all();
        if (products.length === 0) {
            return res.status(400).json({ error: 'No active products found. Please add products first.' });
        }

        let ordersCreated = 0;
        let orderItemsCreated = 0;

        // Create orders for up to 5 customers
        customers.slice(0, 5).forEach((user, index) => {
            const orderResult = db.prepare(`
                INSERT INTO orders (user_id, user_email, status, total, items, delivery_date, created_at)
                VALUES (?, ?, ?, ?, ?, date('now', '+${index + 1} days'), datetime('now'))
            `).run(user.id, user.email, 'Pending', 0, '[]');

            ordersCreated++;
            const orderId = orderResult.lastInsertRowid;

            // Add 2-3 random products
            const numItems = 2 + Math.floor(Math.random() * 2);
            let orderTotal = 0;
            const orderItemsList = [];

            for (let i = 0; i < numItems; i++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = 1 + Math.floor(Math.random() * 3);
                const subtotal = product.price * quantity;
                orderTotal += subtotal;

                db.prepare(`
                    INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type)
                    VALUES (?, ?, ?, ?, ?, 'product')
                `).run(orderId, product.id, product.name, quantity, product.price);

                orderItemsList.push({
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    total: subtotal
                });

                orderItemsCreated++;
            }

            db.prepare('UPDATE orders SET total = ?, items = ? WHERE id = ?')
                .run(orderTotal, JSON.stringify(orderItemsList), orderId);
        });

        console.log('[Utilities] Order seeding complete');

        res.json({
            success: true,
            created: {
                orders: ordersCreated,
                orderItems: orderItemsCreated
            },
            totalOrders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count
        });
    } catch (error) {
        console.error('[Utilities] Seed orders error:', error);
        res.status(500).json({ error: 'Failed to seed orders', details: error.message });
    }
});

// GET /api/admin/utilities/verify-database
router.get('/admin/utilities/verify-database', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        res.json({
            success: true,
            counts: {
                users: userRepository.count(),
                admins: userRepository.countAdmins(),
                customers: userRepository.countCustomers(),
                orders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count,
                products: db.prepare('SELECT COUNT(*) as count FROM products').get().count
            }
        });
    } catch (error) {
        console.error('[Utilities] Verify error:', error);
        res.status(500).json({ error: 'Failed to verify database', details: error.message });
    }
});

// POST /api/admin/utilities/clean-temp-files
router.post('/admin/utilities/clean-temp-files', checkRole(['super_admin']), (req, res) => {
    try {
        const filesToDelete = [
            path.join(__dirname, '../../cleanup-db.js'),
            path.join(__dirname, '../../cleanup-result.txt'),
            path.join(__dirname, '../../check-schema.js'),
            path.join(__dirname, '../../test-utilities.js')
        ];

        let deleted = 0;
        filesToDelete.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                deleted++;
                console.log(`[Utilities] Deleted: ${file}`);
            }
        });

        res.json({
            success: true,
            deleted,
            message: `Deleted ${deleted} temporary file(s)`
        });
    } catch (error) {
        console.error('[Utilities] Clean temp files error:', error);
        res.status(500).json({ error: 'Failed to clean temp files', details: error.message });
    }
});

// GET /api/admin/utilities/query/:table
router.get('/admin/utilities/query/:table', checkRole(['admin', 'super_admin']), (req, res) => {
    const { table } = req.params;
    const allowedTables = ['users', 'orders', 'products', 'delivery_windows', 'addresses', 'categories', 'box_templates', 'admin_types'];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    try {
        const results = db.prepare(`SELECT * FROM ${table} LIMIT 100`).all();
        res.json({ success: true, results, count: results.length });
    } catch (error) {
        console.error('[Utilities Query Error]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

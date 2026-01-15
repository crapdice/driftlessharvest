const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const { checkRole } = require('../middleware/auth');

// POST /api/admin/utilities/clean-database
router.post('/admin/utilities/clean-database', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting database cleanup...');

        // Delete in correct order (foreign keys)
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const users = db.prepare(`DELETE FROM users WHERE email != 'admin@driftlessharvest.com'`).run();
        const addresses = db.prepare('DELETE FROM addresses').run();
        const carts = db.prepare('DELETE FROM active_carts').run();
        const payments = db.prepare('DELETE FROM payments').run();

        console.log('[Utilities] Database cleanup complete');

        res.json({
            success: true,
            deleted: {
                orderItems: orderItems.changes,
                orders: orders.changes,
                users: users.changes,
                addresses: addresses.changes,
                carts: carts.changes,
                payments: payments.changes
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
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const payments = db.prepare('DELETE FROM payments').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const carts = db.prepare('DELETE FROM active_carts').run();

        console.log('[Utilities] Orders cleanup complete');

        res.json({
            success: true,
            deleted: {
                orders: orders.changes,
                orderItems: orderItems.changes,
                carts: carts.changes,
                payments: payments.changes
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

        // Delete customer users and addresses (preserve admins)
        const users = db.prepare(`DELETE FROM users WHERE role = 'user'`).run();
        const addresses = db.prepare('DELETE FROM addresses WHERE user_id NOT IN (SELECT id FROM users)').run();

        console.log('[Utilities] Users cleanup complete');

        res.json({
            success: true,
            deleted: {
                users: users.changes,
                addresses: addresses.changes
            }
        });
    } catch (error) {
        console.error('[Utilities] Clean users error:', error);
        res.status(500).json({ error: 'Failed to clean users', details: error.message });
    }
});

// POST /api/admin/utilities/seed-database
router.post('/admin/utilities/seed-database', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting database seeding...');

        const bcrypt = require('bcryptjs');
        let usersCreated = 0;
        let addressesCreated = 0;
        let ordersCreated = 0;
        let orderItemsCreated = 0;

        // Create 5 dummy users
        const dummyUsers = [
            { email: 'customer1@test.com', first_name: 'John', last_name: 'Doe', phone: '(555) 123-4567' },
            { email: 'customer2@test.com', first_name: 'Jane', last_name: 'Smith', phone: '(555) 234-5678' },
            { email: 'customer3@test.com', first_name: 'Bob', last_name: 'Johnson', phone: '(555) 345-6789' },
            { email: 'customer4@test.com', first_name: 'Alice', last_name: 'Williams', phone: '(555) 456-7890' },
            { email: 'customer5@test.com', first_name: 'Charlie', last_name: 'Brown', phone: '(555) 567-8901' }
        ];

        const hashedPassword = bcrypt.hashSync('password123', 10);

        dummyUsers.forEach((user, index) => {
            // Create user
            const userResult = db.prepare(`
                INSERT INTO users (email, password, first_name, last_name, phone, role, created_at)
                VALUES (?, ?, ?, ?, ?, 'user', datetime('now'))
            `).run(user.email, hashedPassword, user.first_name, user.last_name, user.phone);

            usersCreated++;
            const userId = userResult.lastInsertRowid;

            // Create address for user
            db.prepare(`
                INSERT INTO addresses (user_id, street, city, state, zip, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `).run(userId, `${100 + index} Main St`, 'Madison', 'WI', `5370${index}`);

            addressesCreated++;
        });

        // Get some products for orders
        const products = db.prepare('SELECT id, name, price FROM products WHERE is_active = 1 LIMIT 10').all();

        if (products.length > 0) {
            // Create 5 dummy orders
            const userIds = db.prepare('SELECT id FROM users WHERE role = "user" ORDER BY id DESC LIMIT 5').all();

            userIds.forEach((user, index) => {
                const orderResult = db.prepare(`
                    INSERT INTO orders (user_id, status, total, delivery_date, created_at)
                    VALUES (?, ?, ?, date('now', '+${index + 1} days'), datetime('now'))
                `).run(user.id, 'Pending', 0);

                ordersCreated++;
                const orderId = orderResult.lastInsertRowid;

                // Add 2-3 random products to each order
                const numItems = 2 + Math.floor(Math.random() * 2);
                let orderTotal = 0;

                for (let i = 0; i < numItems; i++) {
                    const product = products[Math.floor(Math.random() * products.length)];
                    const quantity = 1 + Math.floor(Math.random() * 3);
                    const subtotal = product.price * quantity;
                    orderTotal += subtotal;

                    db.prepare(`
                        INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).run(orderId, product.id, product.name, quantity, product.price, subtotal);

                    orderItemsCreated++;
                }

                // Update order total
                db.prepare('UPDATE orders SET total = ? WHERE id = ?').run(orderTotal, orderId);
            });
        }

        console.log('[Utilities] Database seeding complete');

        res.json({
            success: true,
            created: {
                users: usersCreated,
                addresses: addressesCreated,
                orders: ordersCreated,
                orderItems: orderItemsCreated
            }
        });
    } catch (error) {
        console.error('[Utilities] Seed database error:', error);
        res.status(500).json({ error: 'Failed to seed database', details: error.message });
    }
});

// GET /api/admin/utilities/verify-database
router.get('/admin/utilities/verify-database', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const admins = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get().count;
        const orders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
        const products = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

        res.json({
            success: true,
            counts: {
                users,
                admins,
                orders,
                products
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
            path.join(__dirname, '../../cleanup-result.txt')
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
    const allowedTables = ['users', 'orders', 'products', 'delivery_windows', 'addresses', 'categories', 'box_templates'];

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

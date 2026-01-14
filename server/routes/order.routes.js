const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema } = require('../schemas');

// POST /api/orders
// DEPRECATED: This route is legacy and contains incorrect inventory logic for Box Templates.
// Use /api/create-payment-intent (payment.routes.js) instead.
/*
router.post('/orders', validate(createOrderSchema), async (req, res) => {
    try {
        const order = req.body;
        // Zod ensures order.items exists and has length > 0

        // Construct comprehensive shipping details
        const shippingInfo = order.shipping || {};
        const contactInfo = order.shipping_details || {}; // contains name

        // Ensure email is present
        const userEmail = order.user_email || order.userEmail || req.user?.email;
        if (!userEmail) return res.status(400).json({ error: 'User email is required' });

        const shippingDetailsObj = {
            name: contactInfo.name || 'Guest',
            email: userEmail,
            street: shippingInfo.street || '',
            city: shippingInfo.city || '',
            state: shippingInfo.state || '',
            zip: shippingInfo.zip || '',
            phone: shippingInfo.phone || contactInfo.phone || '', // Check both places just in case
            delivery_window: shippingInfo.date || order.deliveryWindow || '',
            shipping: shippingInfo
        };

        // Phase 2: Normalized Insert (Transaction with Inventory Check)
        const insertTransaction = db.transaction(() => {
            // 0. Pre-Check Inventory for ALL items
            // We do this first to return a comprehensive list of failures
            const failedItems = [];

            for (const item of order.items) {
                // Determine ID (handle both product and box template IDs)
                const id = item.id;

                // Only check stock for products, not curated boxes (templates)
                // Assuming box templates don't track stock themselves, only their contents?
                // For simplicity/safety, we check 'products' table. If it's a box, it might not be there.

                const product = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(id);
                if (product) {
                    if (product.stock < item.qty) {
                        failedItems.push({
                            id: item.id,
                            name: product.name,
                            requested: item.qty,
                            available: product.stock
                        });
                    }
                }
            }

            if (failedItems.length > 0) {
                const err = new Error('Insufficient Stock');
                err.status = 409;
                err.failedItems = failedItems;
                throw err;
            }

            // 1. Decrement Stock (Atomic)
            for (const item of order.items) {
                // Only update if it exists in products (it might be a box template)
                const exists = db.prepare('SELECT 1 FROM products WHERE id = ?').get(item.id);
                if (exists) {
                    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.qty, item.id);
                }
            }

            // 2. Insert Order Header
            // We still populate 'items' JSON for backward compatibility / backup
            const result = db.prepare(`
                INSERT INTO orders (user_email, items, total, shipping_details, status)
                VALUES (?, ?, ?, ?, 'Pending')
            `).run(
                userEmail,
                JSON.stringify(order.items), // Legacy support
                order.total || 0,
                JSON.stringify(shippingDetailsObj)
            );

            const orderId = result.lastInsertRowid;

            // 3. Insert Address (Optional, for autocomplete later)
            // Simplified: Insert if new.
            db.prepare(`
                INSERT INTO addresses (user_email, name, street, city, zip, state, phone)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                userEmail,
                shippingDetailsObj.name,
                shippingDetailsObj.street,
                shippingDetailsObj.city,
                shippingDetailsObj.zip,
                shippingDetailsObj.state,
                shippingDetailsObj.phone
            );

            // Link address to order
            const addressId = db.prepare('SELECT last_insert_rowid() as id').get().id;
            db.prepare('UPDATE orders SET address_id = ? WHERE id = ?').run(addressId, orderId);

            // 4. Insert Order Items (Normalized)
            const insertItem = db.prepare(`
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            for (const item of order.items) {
                insertItem.run(
                    orderId,
                    item.id,
                    item.name || 'Unknown Item',
                    item.qty,
                    item.price || 0,
                    item.type || 'product'
                );
            }

            // 5. Clear Active Cart
            db.prepare('DELETE FROM active_carts WHERE user_email = ?').run(userEmail);

            return { lastInsertRowid: orderId };
        });

        const info = insertTransaction();
        res.json({ success: true, orderId: info.lastInsertRowid });
    } catch (err) {
        console.error(err);
        const status = err.status || 500;
        res.status(status).json({
            error: 'Failed to place order',
            details: err.message,
            failedItems: err.failedItems // Pass the list to client
        });
    }
});
*/

// GET /api/orders/mine
router.get('/orders/mine', authenticateToken, (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT * FROM orders 
            WHERE user_email = ? 
            ORDER BY created_at DESC
        `).all(req.user.email);

        const parsedOrders = orders.map(o => {
            let items = [];
            let shipping = {};

            // 1. Try fetching from order_items (Normalized)
            const normalizedItems = db.prepare('SELECT product_id as id, product_name as name, quantity as qty, price_at_purchase as price, item_type as type FROM order_items WHERE order_id = ?').all(o.id);

            if (normalizedItems.length > 0) {
                items = normalizedItems;
            } else {
                // 2. Fallback to JSON blob (Legacy)
                if (o.items) {
                    try {
                        items = JSON.parse(o.items);
                    } catch (e) {
                        console.warn(`Failed to parse items JSON for order ${o.id}`, e);
                        items = []; // Graceful failure
                    }
                }
            }

            // Shipping Details
            if (o.shipping_details) {
                try {
                    shipping = JSON.parse(o.shipping_details);
                } catch (e) {
                    console.warn(`Failed to parse shipping JSON for order ${o.id}`, e);
                }
            }

            // FORCE SYNC: Overwrite delivery_window with the source of truth (Column)
            // This ensures Admin rescheduling flows through to the User immediately.
            if (o.delivery_window) {
                shipping.delivery_window = o.delivery_window;
            }

            return {
                id: o.id.toString(), // Ensure ID is string for frontend compatibility if needed
                date: o.created_at,
                total: o.total,
                status: o.status,
                items: items,
                shipping: shipping
            };
        });

        res.json(parsedOrders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch your orders' });
    }
});

// Update Order Details (Post-Payment)
router.post('/orders/update-details', (req, res) => {
    const { orderId, shipping, delivery_window, email } = req.body;

    if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
    }

    try {
        // Lookup ISO Date
        let deliveryDate = null;
        try {
            const win = db.prepare('SELECT date_value FROM delivery_windows WHERE date_label = ?').get(delivery_window);
            if (win) deliveryDate = win.date_value;
        } catch (e) { }

        const stmt = db.prepare(`
            UPDATE orders 
            SET shipping_details = ?, 
                user_email = ?,
                delivery_window = ?,
                delivery_date = ?
            WHERE id = ?
        `);

        const shippingData = {
            ...shipping,
            delivery_window: delivery_window
        };

        const info = stmt.run(JSON.stringify(shippingData), email, delivery_window, deliveryDate, orderId);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ success: true, message: 'Order details updated' });
    } catch (err) {
        console.error('Update Order Error:', err);
        res.status(500).json({ error: 'Failed to update order details', details: err.message });
    }
});

module.exports = router;

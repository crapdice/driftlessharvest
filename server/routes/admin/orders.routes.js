/**
 * Admin Orders Routes
 * 
 * Handles order management endpoints.
 * Extracted from admin.routes.js for better organization.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { checkRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { orderStatusSchema } = require('../../schemas');

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

module.exports = router;

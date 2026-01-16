const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkRole } = require('../middleware/auth');
const InventoryService = require('../services/InventoryService');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// POST /api/create-payment-intent
// POST /api/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
    try {
        console.log('[Payment Init] Starting payment intent creation...');

        if (!stripe) {
            console.error('[Payment Init] Stripe not configured');
            return res.status(503).json({ error: 'Payment service unavailable (Configuration missing)' });
        }

        const { items, userEmail, shipping } = req.body;
        console.log('[Payment Init] Request data:', {
            itemCount: items?.length,
            userEmail,
            hasShipping: !!shipping
        });

        if (!items || items.length === 0) {
            console.error('[Payment Init] Empty cart');
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // 1. Calculate Total & Validate Stock (Server-Side)
        console.log('[Payment Init] Step 1: Validating stock...');
        const reserveTx = db.transaction(() => {
            const { failedItems, verifiedItems, total } = InventoryService.validateStock(items);

            if (failedItems.length > 0) {
                const err = new Error('Inventory Check Failed');
                err.failedItems = failedItems;
                throw err;
            }

            // Reserve Logic
            InventoryService.reserveStock(verifiedItems);

            return { total, verifiedItems };
        });

        // Execute Reservation
        let orderDetails;
        try {
            orderDetails = reserveTx();
            console.log('[Payment Init] Stock validated and reserved:', {
                total: orderDetails.total,
                itemCount: orderDetails.verifiedItems.length
            });
        } catch (e) {
            console.error("[Payment Init] Stock Reservation Failed:", e.message);
            if (e.failedItems) {
                return res.status(409).json({ error: 'Some items are out of stock', failedItems: e.failedItems });
            }
            throw e;
        }

        // Shipping object
        const shippingObj = shipping || {};

        // Lookup delivery_date from label
        console.log('[Payment Init] Step 2: Looking up delivery date...');
        let deliveryDate = null;
        try {
            if (shippingObj.date) {
                const win = db.prepare('SELECT date_value FROM delivery_windows WHERE date_label = ? OR date_value = ?').get(shippingObj.date, shippingObj.date);
                if (win) {
                    deliveryDate = win.date_value;
                    console.log('[Payment Init] Delivery date found:', deliveryDate);
                }
            }
        } catch (e) {
            console.warn("[Payment Init] Delivery date lookup failed:", e);
        }

        // 3. Create Draft Order (Pending Payment)
        console.log('[Payment Init] Step 3: Creating draft order...');
        const stmt = db.prepare(`
            INSERT INTO orders (user_email, items, total, shipping_details, status, delivery_window, delivery_date)
            VALUES ($email, $items, $total, $shipping, $status, $window, $date)
        `);

        // Prepare Insert Object
        // FIX: Ensure we use verifiedItems from the reservation scope
        const insertObj = {
            email: userEmail || 'guest',
            items: JSON.stringify(orderDetails.verifiedItems),
            total: orderDetails.total,
            shipping: JSON.stringify({
                name: `${shippingObj.firstName || ''} ${shippingObj.lastName || ''}`.trim(),
                firstName: shippingObj.firstName || '',
                lastName: shippingObj.lastName || '',
                email: userEmail || '',
                address: shippingObj.address || '',
                city: shippingObj.city || '',
                state: shippingObj.state || '',
                zip: shippingObj.zip || '',
                date: shippingObj.date || '',
                delivery_window: shippingObj.date || ''
            }),
            status: 'Pending Payment',
            window: shippingObj.date || null,
            date: deliveryDate || null
        };

        const result = stmt.run(insertObj);
        let orderId = result.lastInsertRowid;
        console.log('[Payment Init] Draft order created:', orderId);

        // 3a. Insert Normalized Order Items
        console.log('[Payment Init] Step 4: Inserting order items...');
        const insertItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of orderDetails.verifiedItems) {
            insertItem.run(
                orderId,
                item.id,
                item.name || 'Unknown Item',
                item.qty,
                item.price || 0,
                item.type || 'product'
            );
        }
        console.log('[Payment Init] Order items inserted');

        // 3. Create Stripe PaymentIntent
        console.log('[Payment Init] Step 5: Creating Stripe PaymentIntent...');
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(orderDetails.total * 100), // Cents
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
                orderId: orderId.toString(),
                userEmail: userEmail || 'guest'
            },
            receipt_email: (userEmail && userEmail.includes('@')) ? userEmail : null
        });

        console.log('[Payment Init] PaymentIntent created successfully:', paymentIntent.id);

        res.json({
            clientSecret: paymentIntent.client_secret,
            orderId: orderId
        });

    } catch (e) {
        console.error("[Payment Init] ERROR:", {
            message: e.message,
            stack: e.stack,
            name: e.name
        });
        res.status(500).json({
            error: 'Failed to initialize payment',
            details: e.message,
            step: 'Payment initialization failed. Please check server logs for details.'
        });
    }
});

// POST /api/webhook
// We use req.rawBody (populated by app.js middleware) for signature verification
router.post('/webhook', async (req, res) => {
    if (!stripe) return res.status(503).send('Stripe not configured');
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        if (!req.rawBody) throw new Error('Raw body not available');
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Webhook Signature Error", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        console.log(`Payment succeeded for Order ${orderId}`);

        // Mark Order as Paid / Pending Delivery
        // User Verification Request: Status "Payment Succeeded"

        // 1. Record Payment in Ledger
        try {
            const rawData = JSON.stringify(paymentIntent);
            // UPSERT logic: if we somehow get duplicate events, IGNORE or UPDATE. 
            // SQLite INSERT OR IGNORE covers uniqueness on stripe_payment_id
            db.prepare(`
                INSERT OR IGNORE INTO payments (order_id, stripe_payment_id, amount, currency, status, receipt_email, raw_data)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                orderId,
                paymentIntent.id,
                paymentIntent.amount,
                paymentIntent.currency,
                paymentIntent.status,
                paymentIntent.receipt_email,
                rawData
            );
        } catch (e) {
            console.error("Failed to record payment ledger", e);
            // Don't fail the webhook response, we still want to update order status
        }

        db.prepare("UPDATE orders SET status = 'Paid' WHERE id = ?").run(orderId);
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        console.log(`Payment failed/canceled for Order ${orderId}`);

        // Update Status to Payment Failed
        // We do NOT release stock immediately here if we want to allow retry, 
        // but for now, assuming failed intent = end of current attempt flow.
        // Actually, let's keep it as Canceled/Failed logic -> Release Stock.

        const cancelTx = db.transaction(() => {
            db.prepare("UPDATE orders SET status = 'Payment Failed' WHERE id = ?").run(orderId);

            // Get Items and Release Stock
            const order = db.prepare('SELECT items FROM orders WHERE id = ?').get(orderId);
            if (order && order.items) {
                const items = JSON.parse(order.items);
                InventoryService.releaseStock(items);
            }
        });
        cancelTx();
    }

    res.json({ received: true });
});


// POST /api/sync-payment/:id
// POST /api/orders/:id/verify-payment (User Triggered)
router.post('/orders/:id/verify-payment', require('../middleware/auth').authenticateToken, async (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
    const orderId = req.params.id;

    try {
        // 1. Verify Ownership
        const order = db.prepare('SELECT user_email FROM orders WHERE id = ?').get(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Allow if user is admin OR if email matches token
        // Use req.user from authenticateToken
        const isOwner = (req.user.email === order.user_email) || (req.user.role === 'admin' || req.user.role === 'super_admin');

        if (!isOwner) {
            return res.status(403).json({ error: 'Unauthorized to verify this order' });
        }

        console.log(`[Verify] User ${req.user.email} verifying Order ${orderId}...`);

        // 2. Search Stripe
        const searchResult = await stripe.paymentIntents.search({
            query: `metadata['orderId']:'${orderId}'`,
        });

        if (searchResult.data.length === 0) {
            return res.json({ success: false, status: 'Not Found', msg: 'No payment record found yet.' });
        }

        // 3. Check Success
        // Find successful intent or fallback to latest
        const pi = searchResult.data.find(p => p.status === 'succeeded') || searchResult.data[0];

        if (pi.status === 'succeeded') {
            // Update DB
            db.prepare(`
                INSERT OR IGNORE INTO payments (order_id, stripe_payment_id, amount, currency, status, receipt_email, raw_data)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                orderId,
                pi.id,
                pi.amount,
                pi.currency,
                pi.status,
                pi.receipt_email,
                JSON.stringify(pi)
            );

            db.prepare("UPDATE orders SET status = 'Paid' WHERE id = ?").run(orderId);
            return res.json({ success: true, status: 'Paid' });
        } else {
            return res.json({ success: false, status: pi.status });
        }

    } catch (e) {
        console.error("Verify Error", e);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// POST /api/admin/sync-payment/:id (Admin Triggered)
router.post('/admin/sync-payment/:id', checkRole(['admin', 'super_admin']), async (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
    const orderId = req.params.id;

    try {
        console.log(`[Sync] Checking Stripe for orderId: ${orderId}...`);

        // 1. Search for PaymentIntent by OrderMetadata
        const searchResult = await stripe.paymentIntents.search({
            query: `metadata['orderId']:'${orderId}'`,
        });

        if (searchResult.data.length === 0) {
            console.log(`[Sync] No payment found for Order ${orderId}`);
            return res.json({ success: false, msg: 'No Stripe Payment found for this Order ID' });
        }

        // 2. Analyze the latest attempt
        const pi = searchResult.data.find(p => p.status === 'succeeded') || searchResult.data[0];

        if (pi.status === 'succeeded') {
            console.log(`[Sync] Found SUCCEEDED PaymentIntent ${pi.id}`);

            // 3. Update Local DB (Idempotent)
            // Record Payment
            db.prepare(`
                INSERT OR IGNORE INTO payments (order_id, stripe_payment_id, amount, currency, status, receipt_email, raw_data)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                orderId,
                pi.id,
                pi.amount,
                pi.currency,
                pi.status,
                pi.receipt_email,
                JSON.stringify(pi)
            );

            // Update Order Status
            db.prepare("UPDATE orders SET status = 'Paid' WHERE id = ?").run(orderId);

            return res.json({ success: true, status: 'Paid', msg: 'Order payment synced successfully!' });
        } else {
            return res.json({ success: false, status: pi.status, msg: `Stripe Payment status is '${pi.status}'` });
        }

    } catch (e) {
        console.error("[Sync] Error", e);
        return res.status(500).json({ error: 'Sync failed', details: e.message });
    }
});

module.exports = router;

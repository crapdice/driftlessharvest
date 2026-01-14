const db = require('../db');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Sweeper Service
 * Periodically checks for 'Pending Payment' orders that might have missed their webhook.
 */

async function checkPendingOrders() {
    if (!stripe) {
        console.warn('[Sweeper] Stripe not configured, skipping check.');
        return;
    }

    try {
        console.log('[Sweeper] Starting Pending Payment Cleanup...');

        // 1. Find Pending Orders created in the last 24 hours
        // We avoid older orders to save API calls and avoid zombie data loops
        const pendingOrders = db.prepare(`
            SELECT id, user_email, created_at 
            FROM orders 
            WHERE status = 'Pending Payment' 
            AND created_at > datetime('now', '-1 day')
        `).all();

        if (pendingOrders.length === 0) {
            console.log('[Sweeper] No recent pending orders found.');
            return;
        }

        console.log(`[Sweeper] Found ${pendingOrders.length} pending orders to check.`);

        let fixedCount = 0;

        // 2. Iterate and Check each
        for (const order of pendingOrders) {
            try {
                // Search Stripe
                const searchResult = await stripe.paymentIntents.search({
                    query: `metadata['orderId']:'${order.id}'`,
                    limit: 1 // We only need one success
                });

                const pi = searchResult.data.find(p => p.status === 'succeeded');

                if (pi) {
                    console.log(`[Sweeper] FOUND PAYMENT for Order #${order.id}. Syncing...`);

                    // Update DB (Transaction for safety)
                    const tx = db.transaction(() => {
                        db.prepare(`
                            INSERT OR IGNORE INTO payments (order_id, stripe_payment_id, amount, currency, status, receipt_email, raw_data)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `).run(
                            order.id,
                            pi.id,
                            pi.amount,
                            pi.currency,
                            pi.status,
                            pi.receipt_email,
                            JSON.stringify(pi)
                        );

                        db.prepare("UPDATE orders SET status = 'Paid' WHERE id = ?").run(order.id);
                    });

                    tx();
                    fixedCount++;
                }
            } catch (err) {
                console.error(`[Sweeper] Error checking Order #${order.id}:`, err.message);
            }

            // Artificial delay to be nice to Stripe API rate limits? 
            // 20 requests/sec is allowed, we are likely fine without it for small volumes.
        }

        console.log(`[Sweeper] Finished. Fixed ${fixedCount} orders.`);

    } catch (e) {
        console.error('[Sweeper] Fatal Error:', e);
    }
}

function startSweeper(intervalMs = 15 * 60 * 1000) {
    if (process.env.NODE_ENV === 'test') return; // Don't run in tests

    console.log(`[Sweeper] Service initialized. Running every ${intervalMs / 60000} minutes.`);

    // Initial Run (after small delay to let server boot)
    setTimeout(checkPendingOrders, 5000);

    // Interval
    setInterval(checkPendingOrders, intervalMs);
}

module.exports = { startSweeper, checkPendingOrders };

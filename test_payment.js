require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'server/db/harvest.db'));
const InventoryService = require('./server/services/InventoryService');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Mock request data from debug_keys.log
const items = [{ id: 1, type: 'product', qty: 1, price: 4.5, name: 'Heirloom Tomatoes' }];
const userEmail = 'test@example.com';
const shipping = null;

async function run() {
    try {
        console.log('--- Step 1: Validate Stock ---');
        const { failedItems, verifiedItems, total } = InventoryService.validateStock(items);
        console.log('Result:', { failedItems, verifiedItems, total });

        console.log('\n--- Step 2: Reserve Stock (Transaction) ---');
        const reserveTx = db.transaction(() => {
            InventoryService.reserveStock(verifiedItems);
            return { total, verifiedItems };
        });
        const orderDetails = reserveTx();
        console.log('Order Details:', orderDetails);

        console.log('\n--- Step 3: Insert Order ---');
        const deliveryDate = null;
        const insertObj = {
            email: userEmail || 'guest',
            items: JSON.stringify(verifiedItems),
            total: orderDetails.total,
            shipping: JSON.stringify({
                name: 'Test',
                firstName: 'Test',
                lastName: 'User',
                email: userEmail || '',
                address: '',
                city: '',
                state: '',
                zip: '',
                date: '',
                delivery_window: ''
            }),
            status: 'Pending Payment',
            window: null,
            date: deliveryDate || null
        };
        const stmt = db.prepare(`
            INSERT INTO orders (user_email, items, total, shipping_details, status, delivery_window, delivery_date)
            VALUES ($email, $items, $total, $shipping, $status, $window, $date)
        `);
        const result = stmt.run(insertObj);
        console.log('Insert Result:', result);
        const orderId = result.lastInsertRowid;

        console.log('\n--- Step 4: Insert Items ---');
        const insertItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of verifiedItems) {
            insertItem.run(
                orderId,
                item.id,
                item.name || 'Unknown Item',
                item.qty,
                item.price || 0,
                item.type || 'product'
            );
        }
        console.log('Items inserted.');

        console.log('\n--- Step 5: Stripe ---');
        if (!stripe) throw new Error('Stripe not configured');
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(orderDetails.total * 100),
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: { orderId: orderId.toString(), userEmail: userEmail || 'guest' },
            receipt_email: userEmail
        });
        console.log('Stripe Success:', paymentIntent.id);

    } catch (e) {
        console.error('\nERROR CAUGHT:');
        console.error(e.message);
        console.error(e.stack);
    } finally {
        db.close();
    }
}

run();

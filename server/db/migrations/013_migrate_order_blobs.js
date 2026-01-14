module.exports = {
    up: (db) => {
        // 1. Add delivery_window column to orders if it doesn't exist
        const columns = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
        if (!columns.includes('delivery_window')) {
            db.prepare("ALTER TABLE orders ADD COLUMN delivery_window TEXT").run();
        }

        if (!columns.includes('user_id')) {
            db.prepare("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
        }

        // 1.5 Ensure orders has address_id (Just in case, though usually seemingly present?)
        // Actually, let's stick to user_id for now as that was the explicit error.

        // 1.6 Ensure addresses has user_id (Fix for migration 013 collision)

        // 1.5 Ensure addresses has user_id (Fix for migration 013 collision)
        const addrCols = db.prepare("PRAGMA table_info(addresses)").all().map(c => c.name);
        if (!addrCols.includes('user_id')) {
            db.prepare("ALTER TABLE addresses ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
        }

        const orders = db.prepare("SELECT * FROM orders").all();

        const insertAddress = db.prepare(`
            INSERT INTO addresses (user_email, user_id, name, street, city, state, zip, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertOrderItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const updateOrder = db.prepare(`
            UPDATE orders SET address_id = ?, user_id = COALESCE(user_id, ?), delivery_window = ? WHERE id = ?
        `);

        for (const order of orders) {
            let addressId = order.address_id;
            let userId = order.user_id;
            let deliveryWindow = order.delivery_window;

            // 1. Backfill user_id if missing
            if (!userId && order.user_email) {
                const user = db.prepare("SELECT id FROM users WHERE email = ?").get(order.user_email);
                if (user) userId = user.id;
            }

            // 2. Parse Shipping Details for Address and Delivery Window
            if (order.shipping_details) {
                try {
                    const details = JSON.parse(order.shipping_details);

                    // Backfill delivery_window from blob if column was empty
                    if (!deliveryWindow) {
                        deliveryWindow = details.delivery_window || details.date || '';
                    }

                    // Backfill address if missing
                    if (!addressId) {
                        const result = insertAddress.run(
                            order.user_email,
                            userId || null,
                            details.name || 'Guest',
                            details.street || '',
                            details.city || '',
                            details.state || '',
                            details.zip || '',
                            details.phone || ''
                        );
                        addressId = result.lastInsertRowid;
                    }
                } catch (e) {
                    console.warn(`[Migration 013] Failed to parse shipping_details for order ${order.id}:`, e.message);
                }
            }

            // Update order with new metadata
            updateOrder.run(addressId, userId, deliveryWindow || '', order.id);

            // 3. Backfill Order Items
            try {
                const itemCount = db.prepare("SELECT COUNT(*) as count FROM order_items WHERE order_id = ?").get(order.id).count;
                if (itemCount === 0 && order.items) {
                    const items = JSON.parse(order.items);
                    if (Array.isArray(items)) {
                        for (const item of items) {
                            insertOrderItem.run(
                                order.id,
                                item.id ? String(item.id) : null,
                                item.name || 'Unknown Item',
                                item.qty || 1,
                                item.price || 0,
                                item.type || 'product'
                            );
                        }
                    }
                }
            } catch (e) {
                console.warn(`[Migration 013] Failed to parse items for order ${order.id}:`, e.message);
            }
        }
        console.log(`[Migration 013] Order data migration and schema fix complete.`);
    }
};

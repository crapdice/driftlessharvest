const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../server/db/harvest.db');
const db = new Database(DB_PATH);

console.log('Starting Migration: Orders -> Order Items...');

try {
    // 1. Ensure Table Exists
    db.prepare(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id TEXT,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price_at_purchase REAL NOT NULL,
            item_type TEXT DEFAULT 'product',
            metadata TEXT
        )
    `).run();

    // 2. Fetch all orders
    const orders = db.prepare('SELECT id, items, total FROM orders').all();
    console.log(`Found ${orders.length} orders to check.`);

    let migratedCount = 0;

    // Prepared Statement
    const insertStmt = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type, metadata)
        VALUES (@order_id, @product_id, @name, @qty, @price, @type, @meta)
    `);

    // Clean existing items logic to prevent duplicates on potential re-runs
    const deleteStmt = db.prepare('DELETE FROM order_items WHERE order_id = ?');

    // Transaction for speed and safety
    const migrationTx = db.transaction((orderList) => {
        for (const order of orderList) {
            try {
                // 1. Clear old entries for this order (idempotency)
                deleteStmt.run(order.id);

                // 2. Parse JSON
                let items = [];
                try {
                    items = JSON.parse(order.items);
                } catch (e) {
                    console.warn(`[Warn] Order ${order.id} has invalid JSON items. Skipping items.`);
                    continue;
                }

                if (!Array.isArray(items)) continue;

                // 3. Insert Items
                for (const item of items) {
                    insertStmt.run({
                        order_id: order.id,
                        product_id: item.id || null, // Some old items might be strings or legacy format
                        name: item.name || 'Unknown Item',
                        qty: Number(item.qty) || 1,
                        price: Number(item.price) || 0,
                        type: item.type || 'product',
                        meta: JSON.stringify(item.options || {})
                    });
                }
                migratedCount++;
            } catch (err) {
                console.error(`[Error] Failed processing order ${order.id}`, err);
            }
        }
    });

    migrationTx(orders);
    console.log(`Migration Complete. Processed ${migratedCount} orders.`);

} catch (err) {
    console.error("Migration Fatal Error:", err);
    process.exit(1);
}

exports.up = function (db) {
    // 1. Addresses Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            name TEXT NOT NULL,
            street TEXT NOT NULL,
            city TEXT NOT NULL,
            zip TEXT NOT NULL,
            state TEXT DEFAULT "",
            phone TEXT DEFAULT "",
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // 2. Link Orders to Addresses
    try {
        const cols = db.prepare("PRAGMA table_info(orders)").all();
        if (!cols.find(c => c.name === 'address_id')) {
            db.prepare('ALTER TABLE orders ADD COLUMN address_id INTEGER REFERENCES addresses(id)').run();
        }
    } catch (e) { }

    // 3. Order Items Table (Normalization)
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

    // 4. Active Carts
    db.prepare(`
        CREATE TABLE IF NOT EXISTS active_carts (
            user_email TEXT PRIMARY KEY,
            items TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
}

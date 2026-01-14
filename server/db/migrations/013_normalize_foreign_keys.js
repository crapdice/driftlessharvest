module.exports = {
    up: (db) => {
        // 1. Add user_id column to addresses
        const addrCols = db.prepare("PRAGMA table_info(addresses)").all().map(c => c.name);
        if (!addrCols.includes('user_id')) {
            db.prepare("ALTER TABLE addresses ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
        }

        // 2. Add user_id column to orders
        const orderCols = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
        if (!orderCols.includes('user_id')) {
            db.prepare("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
        }

        // 3. Populate user_id from user_email
        db.prepare(`
            UPDATE addresses 
            SET user_id = (SELECT id FROM users WHERE users.email = addresses.user_email)
        `).run();

        db.prepare(`
            UPDATE orders 
            SET user_id = (SELECT id FROM users WHERE users.email = orders.user_email)
        `).run();

        // 4. Handle active_carts (Requires rebuild since user_email is PK)
        db.prepare("PRAGMA foreign_keys=OFF").run();

        db.prepare(`
            CREATE TABLE active_carts_new (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                items TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        db.prepare(`
            INSERT INTO active_carts_new (user_id, items, updated_at)
            SELECT u.id, c.items, c.updated_at
            FROM active_carts c
            JOIN users u ON c.user_email = u.email
        `).run();

        db.prepare("DROP TABLE active_carts").run();
        db.prepare("ALTER TABLE active_carts_new RENAME TO active_carts").run();

        db.prepare("PRAGMA foreign_keys=ON").run();

        console.log(`[Migration 013] Normalized addresses, orders, and active_carts with user_id.`);
    }
};

module.exports = {
    up: (db) => {
        console.log('[Migration 013b] Normalizing foreign keys...');

        // Check if addresses table exists
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

        // 1. Add user_id column to addresses (if table exists)
        if (tables.includes('addresses')) {
            const addrCols = db.prepare("PRAGMA table_info(addresses)").all().map(c => c.name);
            if (!addrCols.includes('user_id')) {
                db.prepare("ALTER TABLE addresses ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
            }
            // Only try to populate if user_email column exists
            if (addrCols.includes('user_email')) {
                db.prepare(`
                    UPDATE addresses 
                    SET user_id = (SELECT id FROM users WHERE users.email = addresses.user_email)
                    WHERE user_id IS NULL
                `).run();
            }
        }

        // 2. Add user_id column to orders (if table exists)
        if (tables.includes('orders')) {
            const orderCols = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
            if (!orderCols.includes('user_id')) {
                db.prepare("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
            }
            // Only try to populate if user_email column exists
            if (orderCols.includes('user_email')) {
                db.prepare(`
                    UPDATE orders 
                    SET user_id = (SELECT id FROM users WHERE users.email = orders.user_email)
                    WHERE user_id IS NULL
                `).run();
            }
        }

        // 3. Handle active_carts - ONLY if user_email column exists
        if (tables.includes('active_carts')) {
            const cartCols = db.prepare("PRAGMA table_info(active_carts)").all().map(c => c.name);

            // Only migrate if the old structure exists (user_email column)
            if (cartCols.includes('user_email') && !cartCols.includes('user_id')) {
                console.log('[Migration 013b] Migrating active_carts from user_email to user_id...');

                try {
                    db.prepare("PRAGMA foreign_keys=OFF").run();

                    db.prepare(`
                        CREATE TABLE IF NOT EXISTS active_carts_new (
                            user_id INTEGER PRIMARY KEY REFERENCES users(id),
                            items TEXT,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `).run();

                    db.prepare(`
                        INSERT OR IGNORE INTO active_carts_new (user_id, items, updated_at)
                        SELECT u.id, c.items, c.updated_at
                        FROM active_carts c
                        JOIN users u ON c.user_email = u.email
                    `).run();

                    db.prepare("DROP TABLE active_carts").run();
                    db.prepare("ALTER TABLE active_carts_new RENAME TO active_carts").run();

                    db.prepare("PRAGMA foreign_keys=ON").run();
                } catch (e) {
                    console.warn('[Migration 013b] active_carts migration skipped:', e.message);
                    db.prepare("PRAGMA foreign_keys=ON").run();
                }
            } else {
                console.log('[Migration 013b] active_carts already has correct schema, skipping');
            }
        } else {
            console.log('[Migration 013b] active_carts table does not exist, skipping');
        }

        console.log(`[Migration 013b] Complete.`);
    }
};

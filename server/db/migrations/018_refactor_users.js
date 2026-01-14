module.exports = {
    transaction: false,
    up: (db) => {
        console.log('[Migration 018] Refactoring Users (Unique Email)...');

        db.prepare("PRAGMA foreign_keys=OFF").run(); // Disable FKs to allow drops

        // 1. Drop Dependents
        console.log('  -> Dropping dependent tables...');
        db.prepare("DROP TABLE IF EXISTS active_carts").run();
        db.prepare("DROP TABLE IF EXISTS addresses").run();
        // orders? We wiped them, but if they existed they'd link to users. 
        // We aren't dropping orders here because they might have significant data (even though user said wipe).
        // Since we know orders are empty from previous steps, we technically don't need to drop/recreate them 
        // IF they only reference user_id INTEGER, which doesn't change type.
        // However, if we drop users, the FK constraint on orders might complain if we don't disable FKs.
        // But we can't disable FKs.
        // Force delete orders just in case? Or rely on previous wipe.

        // 2. Drop Users
        console.log('  -> Dropping users...');
        db.prepare("DROP TABLE IF EXISTS users").run();

        // 3. Recreate Users (With UNIQUE constraint)
        console.log('  -> Creating users...');
        db.prepare(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                first_name TEXT,
                last_name TEXT,
                phone TEXT DEFAULT '',
                default_address_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 4. Recreate Addresses
        console.log('  -> Creating addresses...');
        db.prepare(`
            CREATE TABLE addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT,
                name TEXT NOT NULL,
                street TEXT NOT NULL,
                city TEXT NOT NULL,
                zip TEXT NOT NULL,
                state TEXT DEFAULT "",
                phone TEXT DEFAULT "",
                user_id INTEGER REFERENCES users(id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 5. Recreate Active Carts
        console.log('  -> Creating active_carts...');
        db.prepare(`
            CREATE TABLE active_carts (
                cart_key TEXT PRIMARY KEY, 
                user_id INTEGER REFERENCES users(id),
                items TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        db.prepare("PRAGMA foreign_keys=ON").run(); // Re-enable FKs

        console.log('[Migration 018] Complete.');
    }
};

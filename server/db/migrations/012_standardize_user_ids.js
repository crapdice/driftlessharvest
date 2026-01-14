module.exports = {
    up: (db) => {
        // Disable FKs for the swap
        db.prepare("PRAGMA foreign_keys=OFF").run();

        // 1. Create the new standardized table
        db.prepare(`
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                phone TEXT DEFAULT '',
                first_name TEXT,
                last_name TEXT,
                default_address_id INTEGER REFERENCES addresses(id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 2. Transfer data (excluding the old text ID and the legacy address blob)
        db.prepare(`
            INSERT INTO users_new (email, password, role, phone, first_name, last_name, default_address_id, created_at)
            SELECT email, password, role, phone, first_name, last_name, default_address_id, created_at
            FROM users
        `).run();

        // 3. Swap tables
        db.prepare("DROP TABLE users").run();
        db.prepare("ALTER TABLE users_new RENAME TO users").run();

        // 4. Re-enable FKs
        db.prepare("PRAGMA foreign_keys=ON").run();

        console.log(`[Migration 012] User ID standardization complete. Table rebuilt with INTEGER PRIMARY KEY.`);
    }
};

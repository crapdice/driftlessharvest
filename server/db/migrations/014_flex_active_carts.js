module.exports = {
    up: (db) => {
        // Rebuild active_carts to support both User IDs and Guest IDs
        db.prepare("PRAGMA foreign_keys=OFF").run();

        db.prepare(`
            CREATE TABLE active_carts_v3 (
                cart_key TEXT PRIMARY KEY, -- can be user_id (stringified) or guest_id
                user_id INTEGER REFERENCES users(id), -- NULL for guests
                items TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Migrate existing user carts
        db.prepare(`
            INSERT INTO active_carts_v3 (cart_key, user_id, items, updated_at)
            SELECT CAST(user_id AS TEXT), user_id, items, updated_at
            FROM active_carts
        `).run();

        db.prepare("DROP TABLE active_carts").run();
        db.prepare("ALTER TABLE active_carts_v3 RENAME TO active_carts").run();

        db.prepare("PRAGMA foreign_keys=ON").run();

        console.log(`[Migration 014] Re-normalized active_carts to support guest keys.`);
    }
};

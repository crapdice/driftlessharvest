module.exports = {
    up: (db) => {
        console.log('[Migration 017] Refactoring Categories to Integer IDs...');

        // 1. Drop existing table
        db.prepare("DROP TABLE IF EXISTS categories").run();

        // 2. Recreate with Integer ID
        db.prepare(`
            CREATE TABLE categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                display_order INTEGER DEFAULT 0
            )
        `).run();

        console.log('[Migration 017] Complete.');
    }
};

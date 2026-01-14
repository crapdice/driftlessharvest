const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'harvest.db'));

try {
    console.log("Attempting migration: Adding is_archived to products...");
    db.prepare('ALTER TABLE products ADD COLUMN is_archived INTEGER DEFAULT 0').run();
    console.log("Migration successful.");
} catch (e) {
    console.log("Migration skipped or failed (column might exist):", e.message);
}


const db = require('./server/db');

function runMigration() {
    console.log("Starting Migration: Un-delete Archived Products...");

    try {
        const info = db.prepare('UPDATE products SET deleted_at = NULL WHERE is_archived = 1 AND deleted_at IS NOT NULL').run();
        console.log(`Migration Complete. Updated ${info.changes} products.`);
    } catch (e) {
        console.error("Migration Failed:", e);
    }
}

runMigration();

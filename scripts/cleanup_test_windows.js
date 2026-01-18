const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../server/db/harvest.db');
const db = new Database(DB_PATH);

try {
    console.log(`[Cleanup] Connecting to database at: ${DB_PATH}`);

    // Check current state
    const beforeCount = db.prepare("SELECT COUNT(*) as count FROM delivery_windows").get().count;
    console.log(`[Cleanup] Total windows before: ${beforeCount}`);

    // Perform deletion
    const result = db.prepare("DELETE FROM delivery_windows WHERE date_label LIKE '%test%' OR date_value LIKE '%test%'").run();

    const afterCount = db.prepare("SELECT COUNT(*) as count FROM delivery_windows").get().count;
    console.log(`[Cleanup] Deleted ${result.changes} windows.`);
    console.log(`[Cleanup] Total windows after: ${afterCount}`);

} catch (error) {
    console.error('[Cleanup] Error during execution:', error);
} finally {
    db.close();
}

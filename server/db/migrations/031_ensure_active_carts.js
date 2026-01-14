/**
 * Migration 031: Create active_carts table if missing
 * 
 * Issue: The active_carts table may not exist on some deployments,
 * causing the /admin/active-carts endpoint to fail.
 */
exports.up = function (db) {
    console.log('[Migration 031] Ensuring active_carts table exists...');

    try {
        db.prepare(`
            CREATE TABLE IF NOT EXISTS active_carts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL UNIQUE,
                items TEXT DEFAULT '[]',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        console.log('[Migration 031] Complete.');
    } catch (e) {
        console.error('[Migration 031] Error:', e.message);
    }
};

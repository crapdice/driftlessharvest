/**
 * Migration 030: Fix delivery_windows table schema
 * 
 * Issue: Initial schema (001) creates delivery_windows with:
 *   - day_of_week, start_time, end_time, capacity
 * But admin routes expect:
 *   - date_label, date_value, is_active
 * 
 * This migration adds the missing columns.
 */
exports.up = function (db) {
    console.log('[Migration 030] Fixing delivery_windows table schema...');

    try {
        const cols = db.prepare("PRAGMA table_info(delivery_windows)").all().map(c => c.name);

        if (!cols.includes('date_label')) {
            console.log('  -> Adding date_label column');
            db.prepare('ALTER TABLE delivery_windows ADD COLUMN date_label TEXT').run();
        }

        if (!cols.includes('is_active')) {
            console.log('  -> Adding is_active column');
            db.prepare('ALTER TABLE delivery_windows ADD COLUMN is_active INTEGER DEFAULT 1').run();
        }

        // date_value should already exist from migration 005, but just in case
        if (!cols.includes('date_value')) {
            console.log('  -> Adding date_value column');
            db.prepare('ALTER TABLE delivery_windows ADD COLUMN date_value TEXT').run();
        }

        console.log('[Migration 030] Complete.');
    } catch (e) {
        console.error('[Migration 030] Error:', e.message);
    }
};

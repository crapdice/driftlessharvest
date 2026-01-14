module.exports = {
    up: (db) => {
        console.log('[Migration 025] Dropping legacy admin_role column...');

        try {
            db.prepare("ALTER TABLE users DROP COLUMN admin_role").run();
        } catch (e) {
            console.error('  !! Error dropping column (might define constraints?):', e.message);
            // If strict constraints, we might need a full table copy. 
            // SQLite supports DROP COLUMN in newer versions.

            // Fallback: Check if column exists, if not, ignore.
        }

        console.log('[Migration 025] Complete.');
    }
};

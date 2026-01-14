module.exports = {
    up: (db) => {
        // 1. Add 'type' column to addresses if it doesn't exist
        try {
            const columns = db.prepare("PRAGMA table_info(addresses)").all();
            const hasType = columns.some(c => c.name === 'type');

            if (!hasType) {
                console.log('[Migration 028] Adding type column to addresses...');
                // Default to 'billing' for existing addresses as a safe interaction
                db.prepare("ALTER TABLE addresses ADD COLUMN type TEXT DEFAULT 'billing'").run();
            }
        } catch (e) {
            console.warn("[Migration 028] Failed to check/add type column:", e);
        }

        // 2. Add 'is_default' column (optional, but good for "Preferred" address)
        try {
            const columns = db.prepare("PRAGMA table_info(addresses)").all();
            const hasDefault = columns.some(c => c.name === 'is_default');

            if (!hasDefault) {
                console.log('[Migration 028] Adding is_default column to addresses...');
                db.prepare("ALTER TABLE addresses ADD COLUMN is_default INTEGER DEFAULT 0").run();
            }
        } catch (e) {
            console.warn("[Migration 028] Failed to check/add is_default column:", e);
        }
    }
};

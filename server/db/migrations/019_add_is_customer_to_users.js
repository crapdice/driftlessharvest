module.exports = {
    up: (db) => {
        console.log('[Migration 019] Adding is_customer flag to Users...');

        try {
            // Attempt to add column directly
            db.prepare("ALTER TABLE users ADD COLUMN is_customer INTEGER DEFAULT 1").run();
        } catch (e) {
            // Normalize error handling: if column exists, we ignore? 
            // Or if ALTER fails (old SQLite), we might handle it. 
            // Better-sqlite3 usually throws if column exists.
            if (!e.message.includes('duplicate column name')) {
                throw e;
            }
        }

        console.log('[Migration 019] Complete.');
    }
};

module.exports = {
    up: (db) => {
        console.log('[Migration 021] Renaming role to admin_role...');

        try {
            db.prepare("ALTER TABLE users RENAME COLUMN role TO admin_role").run();
        } catch (e) {
            console.error('Migration 021 Error (ignoring if column missing/already renamed):', e.message);
            // Verify if admin_role exists to be safe
            const info = db.prepare("PRAGMA table_info(users)").all();
            if (info.find(c => c.name === 'admin_role')) {
                console.log('  -> admin_role column already exists.');
                return;
            }
            throw e;
        }

        console.log('[Migration 021] Complete.');
    }
};

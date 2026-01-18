module.exports = {
    up: (db) => {
        console.log('[Migration 036] Adding utm_source column to launch_signups...');
        try {
            // Check if column exists
            const info = db.prepare("PRAGMA table_info(launch_signups)").all();
            if (!info.some(col => col.name === 'utm_source')) {
                db.prepare("ALTER TABLE launch_signups ADD COLUMN utm_source TEXT").run();
                console.log('  -> utm_source column added');
            } else {
                console.log('  -> utm_source column already exists');
            }
        } catch (err) {
            console.error('Migration Error (036_add_utm_to_signups):', err);
            throw err;
        }
    }
};

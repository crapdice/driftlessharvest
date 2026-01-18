module.exports = {
    up: (db) => {
        console.log('[Migration 035] Creating launch_signups table...');

        // Create launch signups table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS launch_signups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                source_variant TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Create index for source variant for A/B testing analysis
        db.prepare('CREATE INDEX IF NOT EXISTS idx_launch_variant ON launch_signups(source_variant)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_launch_email ON launch_signups(email)').run();

        console.log('[Migration 035] Launch signups table created successfully');
    },

    down: (db) => {
        console.log('[Migration 035] Dropping launch_signups table...');
        db.prepare('DROP TABLE IF EXISTS launch_signups').run();
        console.log('[Migration 035] Launch signups table dropped');
    }
};

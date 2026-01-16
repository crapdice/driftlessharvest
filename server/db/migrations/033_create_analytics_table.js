module.exports = {
    up: (db) => {
        console.log('[Migration 033] Creating analytics_events table...');

        // Create analytics events table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS analytics_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_id INTEGER,
                event_type TEXT NOT NULL,
                page_url TEXT,
                referrer TEXT,
                device_type TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Create indexes for better query performance
        db.prepare('CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type)').run();

        console.log('[Migration 033] Analytics table created successfully');
    },

    down: (db) => {
        console.log('[Migration 033] Dropping analytics_events table...');
        db.prepare('DROP TABLE IF EXISTS analytics_events').run();
        console.log('[Migration 033] Analytics table dropped');
    }
};

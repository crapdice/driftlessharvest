module.exports = {
    up: (db) => {
        console.log('[Migration 034] Adding ip_address column to analytics_events...');
        
        // Add ip_address column
        db.prepare(`
            ALTER TABLE analytics_events 
            ADD COLUMN ip_address TEXT
        `).run();
        
        console.log('[Migration 034] IP address column added successfully');
    },

    down: (db) => {
        console.log('[Migration 034] Removing ip_address column from analytics_events...');
        
        // SQLite doesn't support DROP COLUMN directly, so we'd need to recreate the table
        // For simplicity, we'll just log this
        console.log('[Migration 034] Note: SQLite does not support DROP COLUMN. Manual intervention required.');
    }
};

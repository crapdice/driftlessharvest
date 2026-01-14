module.exports = {
    up: (db) => {
        console.log('[Migration 022] Creating admin_types table and seeding...');

        // 1. Create Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS admin_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                permissions TEXT DEFAULT '[]', -- JSON Array
                description TEXT
            )
        `).run();

        // 2. Seed Data
        const roles = [
            { name: 'superadmin', perms: '["*"]', desc: 'Full System Access' },
            { name: 'admin', perms: '["*"]', desc: 'General Administrator' },
            { name: 'store_owner', perms: '["view_financials", "manage_all_store"]', desc: 'Owner' },
            { name: 'store_manager', perms: '["manage_products", "manage_orders", "manage_customers"]', desc: 'Manager' },
            { name: 'store_delivery', perms: '["view_delivery_routes", "update_delivery_status"]', desc: 'Delivery Driver' }
        ];

        const insert = db.prepare('INSERT OR IGNORE INTO admin_types (name, permissions, description) VALUES (@name, @permissions, @description)');

        roles.forEach(r => {
            insert.run({
                name: r.name,
                permissions: r.perms,
                description: r.desc
            });
        });

        console.log('[Migration 022] Complete.');
    }
};

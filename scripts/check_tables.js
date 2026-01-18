const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'db', 'harvest.db');
const db = new Database(dbPath);

try {
    const allowedTables = [
        'users', 'orders', 'products', 'delivery_windows', 'addresses',
        'categories', 'farms', 'order_items', 'active_carts', 'payments',
        'box_templates', 'box_items', 'analytics_events', 'launch_signups'
    ];
    allowedTables.forEach(table => {
        try {
            const count = db.prepare(`SELECT count(*) as c FROM ${table}`).get().c;
            console.log(`${table}: ${count} rows`);
        } catch (e) {
            console.log(`${table}: ERROR - ${e.message}`);
        }
    });
} catch (e) {
    console.error(e);
} finally {
    db.close();
}

exports.up = function (db) {
    // Delivery Windows: date_value
    try {
        const cols = db.prepare("PRAGMA table_info(delivery_windows)").all();
        if (!cols.find(c => c.name === 'date_value')) {
            db.prepare('ALTER TABLE delivery_windows ADD COLUMN date_value TEXT').run();
        }
    } catch (e) { }

    // Order Status Timestamps
    try {
        const cols = db.prepare("PRAGMA table_info(orders)").all();
        const missing = [];
        if (!cols.find(c => c.name === 'shipped_at')) missing.push('shipped_at');
        if (!cols.find(c => c.name === 'delivered_at')) missing.push('delivered_at');
        if (!cols.find(c => c.name === 'cancelled_at')) missing.push('cancelled_at');
        if (!cols.find(c => c.name === 'packed_at')) missing.push('packed_at');

        missing.forEach(col => {
            db.prepare(`ALTER TABLE orders ADD COLUMN ${col} DATETIME`).run();
        });
    } catch (e) { }
}

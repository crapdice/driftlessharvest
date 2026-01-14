const db = require('better-sqlite3')('server/db/harvest.db');

try {
    console.log('Clearing order data...');

    // Use transaction for safety
    const clear = db.transaction(() => {
        const delItems = db.prepare('DELETE FROM order_items').run();
        console.log(`- Deleted ${delItems.changes} order items.`);

        const delPayments = db.prepare('DELETE FROM payments').run();
        console.log(`- Deleted ${delPayments.changes} payments.`);

        const delOrders = db.prepare('DELETE FROM orders').run();
        console.log(`- Deleted ${delOrders.changes} orders.`);
    });

    clear();
    console.log('Successfully cleared all orders.');

} catch (e) {
    console.error('Failed to clear orders:', e);
}

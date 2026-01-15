const db = require('./server/db');
const fs = require('fs');

const log = [];

function logMessage(msg) {
    console.log(msg);
    log.push(msg);
}

logMessage('Starting database cleanup...\n');

try {
    // Delete order items first (foreign key constraint)
    logMessage('Deleting order items...');
    const orderItemsResult = db.prepare('DELETE FROM order_items').run();
    logMessage(`✓ Deleted ${orderItemsResult.changes} order items`);

    // Delete orders
    logMessage('Deleting orders...');
    const ordersResult = db.prepare('DELETE FROM orders').run();
    logMessage(`✓ Deleted ${ordersResult.changes} orders`);

    // Delete customer users (keep admin)
    logMessage('Deleting customer users...');
    const usersResult = db.prepare(`DELETE FROM users WHERE email != 'admin@driftlessharvest.com'`).run();
    logMessage(`✓ Deleted ${usersResult.changes} customer users`);

    // Delete addresses
    logMessage('Deleting addresses...');
    const addressesResult = db.prepare('DELETE FROM addresses').run();
    logMessage(`✓ Deleted ${addressesResult.changes} addresses`);

    // Delete active carts
    logMessage('Deleting active carts...');
    const cartsResult = db.prepare('DELETE FROM active_carts').run();
    logMessage(`✓ Deleted ${cartsResult.changes} active carts`);

    // Delete payments
    logMessage('Deleting payment records...');
    const paymentsResult = db.prepare('DELETE FROM payments').run();
    logMessage(`✓ Deleted ${paymentsResult.changes} payment records`);

    logMessage('\n✅ Database cleanup complete!');
    logMessage('Admin user (admin@driftlessharvest.com) preserved.');

    fs.writeFileSync('cleanup-result.txt', log.join('\n'));

} catch (error) {
    const errorMsg = `❌ Error during cleanup: ${error.message}`;
    logMessage(errorMsg);
    fs.writeFileSync('cleanup-result.txt', log.join('\n'));
    process.exit(1);
}

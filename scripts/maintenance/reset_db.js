
const db = require('better-sqlite3')('server/db/harvest.db');

console.log("--- Resetting Database ---");

try {
    // 1. Delete Orders
    const delInfo = db.prepare('DELETE FROM orders').run();
    console.log(`Deleted ${delInfo.changes} orders.`);

    // 2. Reset Stock
    const upInfo = db.prepare('UPDATE products SET stock = 5').run();
    console.log(`Reset stock to 5 for ${upInfo.changes} products.`);

    console.log("--- Reset Complete ---");
} catch (e) {
    console.error("Reset Failed:", e);
}

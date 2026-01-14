const db = require('better-sqlite3')('server/db/harvest.db');

// Check for undefined customers in orders
const badOrders = db.prepare("SELECT * FROM orders WHERE user_email LIKE '%undefined%' OR shipping_details LIKE '%undefined%'").all();
console.log("Bad Orders Count:", badOrders.length);
if (badOrders.length > 0) {
    console.log("Sample Bad Order:", badOrders[0]);
}

// Check Users table schema for address
const user = db.prepare("SELECT * FROM users LIMIT 1").get();
console.log("User Schema Sample:", user);

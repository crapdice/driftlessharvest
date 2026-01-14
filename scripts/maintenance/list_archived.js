const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'harvest.db'));

try {
    const products = db.prepare('SELECT id, name, price, stock, is_active, is_archived FROM products WHERE is_archived = 1').all();
    if (products.length === 0) {
        console.log("No archived products found.");
    } else {
        console.log(JSON.stringify(products, null, 2));
    }
} catch (e) {
    console.error("Error querying database:", e);
}

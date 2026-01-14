
const db = require('./server/db');

function listHiddenProducts() {
    console.log("--- RECOVERABLE PRODUCTS REPORT ---");
    const products = db.prepare('SELECT id, name, deleted_at FROM products WHERE deleted_at IS NOT NULL').all();

    if (products.length === 0) {
        console.log("No hidden/deleted products found.");
    } else {
        products.forEach(p => {
            console.log(`FOUND: "${p.name}" (ID: ${p.id}) - Deleted on: ${p.deleted_at}`);
        });
    }
    console.log("-----------------------------------");
    console.log(`Total Found: ${products.length}`);
}

listHiddenProducts();

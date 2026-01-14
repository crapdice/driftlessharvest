const db = require('better-sqlite3')('server/db/harvest.db');

console.log("--- Products Table Schema ---");
const columns = db.prepare("PRAGMA table_info(products)").all();
console.log(JSON.stringify(columns, null, 2));

console.log("\n--- Categories Table Schema ---");
const catCols = db.prepare("PRAGMA table_info(categories)").all();
console.log(JSON.stringify(catCols, null, 2));

const db = require('../server/db');

console.log("\nBOX ITEMS:");
const items = db.prepare('SELECT rowid, * FROM box_items').all();
items.forEach(i => console.log(JSON.stringify(i)));

console.log("\nPRODUCTS:");
const prods = db.prepare('SELECT id, name FROM products').all();
prods.forEach(p => console.log(JSON.stringify(p)));

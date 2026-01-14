const db = require('./server/db');
const products = db.prepare('SELECT id, name, is_active FROM products').all();
console.log('All Products:', JSON.stringify(products, null, 2));

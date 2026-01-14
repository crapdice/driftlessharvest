const db = require('./server/db');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'server/data/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('--- Config IDs ---');
console.log('Featured Product IDs:', config.featuredProducts);
console.log('Type of first ID:', typeof config.featuredProducts[0]);

console.log('\n--- Database IDs ---');
const products = db.prepare('SELECT id, name FROM products LIMIT 3').all();
console.log('First 3 Products:', products);
console.log('Type of Product ID:', typeof products[0].id);

// Simulate the failed check
const matching = config.featuredProducts.map(id => products.find(p => p.id === id));
console.log('\n--- Matching Check (Strict Equality) ---');
console.log('Matches found with strict equality:', matching.filter(Boolean).length);

// Simulate the fix
const safeMatching = config.featuredProducts.map(id => products.find(p => String(p.id) === String(id)));
console.log('\n--- Matching Check (String Conversion) ---');
console.log('Matches found with string conversion:', safeMatching.filter(Boolean).length);

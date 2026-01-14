const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'server/db/harvest.db'));

const user = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get('admin@harvest.com');
console.log(user ? JSON.stringify(user) : 'User not found');

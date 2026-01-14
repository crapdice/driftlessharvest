const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'server/db/harvest.db'));
const password = bcrypt.hashSync('admin123', 10);

db.prepare('UPDATE users SET password = ? WHERE email = ?')
    .run(password, 'admin@harvest.com');

console.log('Admin password reset to: admin123');

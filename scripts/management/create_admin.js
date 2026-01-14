const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('server/db/harvest.db');

const email = 'admin@harvest.com';
const password = 'password123';
const hashedPassword = bcrypt.hashSync(password, 10);

try {
    // Check if exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (existing) {
        db.prepare("UPDATE users SET role = 'admin', password = ? WHERE email = ?").run(hashedPassword, email);
        console.log(`Updated existing user ${email} to Admin.`);
    } else {
        const id = "u_" + Date.now();
        db.prepare('INSERT INTO users (id, email, password, role, address) VALUES (?, ?, ?, ?, ?)')
            .run(id, email, hashedPassword, 'admin', '{}');
        console.log(`Created new Admin user: ${email}`);
    }
} catch (e) {
    console.error('Failed to create admin:', e);
}

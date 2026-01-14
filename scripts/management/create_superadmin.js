const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'server/db/harvest.db');
const db = new Database(dbPath);

async function createSuperAdmin() {
    const email = 'admin@harvest.local';
    const password = 'HarvestAdmin!2026';
    const role = 'super_admin';
    const id = 'super_admin_' + Date.now();

    // Check if exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (existing) {
        // ... (update logic if exists)
    } else {
        console.log(`Creating users...`);
        const hashedPassword = await bcrypt.hash(password, 10);
        const address = JSON.stringify({ street: '123 Farm Lane', city: 'Viroqua', zip: '54665' });

        // Admin User (780182)
        try {
            db.prepare(`
                INSERT INTO users (id, email, password, role, address, phone, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('780182', 'admin@harvest.local', hashedPassword, 'super_admin', address, '555-0101', new Date().toISOString());
            console.log('Admin created (780182)');
        } catch (e) { console.log('Admin create skipped/failed', e.message); }

        // Standard User (702528)
        try {
            db.prepare(`
                INSERT INTO users (id, email, password, role, address, phone, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('702528', 'user@harvest.local', hashedPassword, 'user', address, '555-0102', new Date().toISOString());
            console.log('User created (702528)');
        } catch (e) { console.log('User create skipped/failed', e.message); }
    }

    console.log(`\nCredentials:\nEmail: ${email}\nPassword: ${password}\n`);
}

createSuperAdmin();

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const MigrationRunner = require('./migrations');

// Use DATA_DIR if provided (Railway Volume), else default to local dir
const DATA_DIR = process.env.DATA_DIR || __dirname;
// Ensure directory exists if it's a custom path
if (process.env.DATA_DIR && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'harvest.db');
const db = new Database(DB_PATH);

// Initialize & Run Migrations
const runner = new MigrationRunner(db);
runner.run();

// Seed Admin User (if env var is present)
if (process.env.ADMIN_PASSWORD) {
    console.log('[Startup] Seeding Admin User...');
    try {
        const bcrypt = require('bcryptjs');
        const adminEmail = 'admin@driftlessharvest.com';
        const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);

        // Ensure admin_types exist (created in migration 022)
        const superAdminType = db.prepare("SELECT id FROM admin_types WHERE name = 'superadmin'").get();
        const typeId = superAdminType ? superAdminType.id : null;

        const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

        if (existingAdmin) {
            db.prepare(`
                UPDATE users 
                SET password = ?, is_admin = 1, role = 'super_admin', admin_type_id = ? 
                WHERE id = ?
            `).run(hashedPassword, typeId, existingAdmin.id);
            console.log('[Startup] Admin password updated.');
        } else {
            db.prepare(`
                INSERT INTO users (email, password, first_name, last_name, is_admin, role, admin_type_id)
                VALUES (?, ?, 'Admin', 'User', 1, 'super_admin', ?)
            `).run(adminEmail, hashedPassword, typeId);
            console.log('[Startup] Admin user created.');
        }
    } catch (e) {
        console.error('[Startup] Failed to seed admin user:', e.message);
    }
}

module.exports = db;

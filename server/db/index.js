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

// --- RESCUE LOGIC (Runs on every startup to fix deployment issues) ---
try {
    // 1. Ensure admin_types exist
    const hasTypes = db.prepare('SELECT count(*) as c FROM admin_types').get();
    if (hasTypes.c === 0) {
        db.prepare("INSERT INTO admin_types (name, permissions) VALUES ('superadmin', '*'), ('admin', 'read,write')").run();
        console.log('[Rescue] Seeded admin_types.');
    }

    // 2. Fix config.json if images are missing (Persistence Recovery)
    const DATA_FILE = path.join(DATA_DIR, 'config.json');
    if (fs.existsSync(DATA_FILE)) {
        const configRaw = fs.readFileSync(DATA_FILE, 'utf8');
        let config;
        try { config = JSON.parse(configRaw); } catch (e) { console.error('[Rescue] Config parse error'); }

        if (config) {
            let changed = false;
            // Ensure Auth Object
            if (!config.auth) { config.auth = {}; changed = true; }
            if (!config.auth.login) { config.auth.login = {}; changed = true; }
            if (!config.auth.signup) { config.auth.signup = {}; changed = true; }

            // Check Paths
            if (!config.auth.login.image) {
                config.auth.login.image = '/assets/images/hero_rustic.png';
                changed = true;
            }
            if (!config.auth.signup.image) {
                config.auth.signup.image = '/assets/images/hero_misty.png';
                changed = true;
            }

            // Ensure Featured Products (Fix blank home page sections)
            if (!config.featuredProducts || config.featuredProducts.length === 0) {
                // Try to find ANY products to feature
                const anyProd = db.prepare('SELECT id FROM products LIMIT 3').all();
                if (anyProd.length > 0) {
                    config.featuredProducts = anyProd.map(p => p.id);
                    changed = true;
                    console.log('[Rescue] Seeded featured products from DB.');
                }
            }

            if (changed) {
                fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2));
                console.log('[Rescue] Patched config.json with missing images/data.');
            }
        }
    }
} catch (e) {
    console.error('[Rescue] Verification failed:', e);
}
// ---------------------------------------------------------------------

module.exports = db;

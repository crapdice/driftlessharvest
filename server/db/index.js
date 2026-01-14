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

// --- RESCUE LOGIC (Runs on every startup to fix deployment issues) ---
try {
    // 1. Ensure admin_types exist
    try {
        // Ensure table exists (in case migrations disastrously failed)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS admin_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                permissions TEXT
            )
        `).run();

        const hasTypes = db.prepare('SELECT count(*) as c FROM admin_types').get();
        if (hasTypes.c === 0) {
            db.prepare("INSERT INTO admin_types (name, permissions) VALUES ('superadmin', '*'), ('admin', 'read,write')").run();
            console.log('[Rescue] Seeded admin_types.');
        }
    } catch (e) {
        // Table might not exist yet if migration failed completely, but we try.
        console.log('[Rescue] admin_types check failed (might be missing table):', e.message);
    }

    // 2. Seed Products if empty
    try {
        const productCount = db.prepare('SELECT count(*) as c FROM products').get();
        if (productCount.c === 0) {
            console.log('[Rescue] Products table empty, seeding default products...');
            const { SEED_PRODUCTS } = require('./seed_data');
            const insertProduct = db.prepare(`
                INSERT INTO products (name, category, price, image_url, tags, stock, is_active, is_archived)
                VALUES (@name, @category, @price, @image_url, @tags, @stock, @is_active, 0)
            `);
            for (const p of SEED_PRODUCTS) {
                insertProduct.run(p);
            }
            console.log(`[Rescue] Seeded ${SEED_PRODUCTS.length} products.`);
        }
    } catch (e) {
        console.log('[Rescue] Product seeding failed:', e.message);
    }

    // 3. Seed Box Templates if empty
    try {
        const boxCount = db.prepare('SELECT count(*) as c FROM box_templates').get();
        if (boxCount.c === 0) {
            console.log('[Rescue] Box templates empty, seeding default templates...');
            const { SEED_BOX_TEMPLATES } = require('./seed_data');
            const insertBox = db.prepare(`
                INSERT INTO box_templates (name, description, base_price, image_url, is_active, items)
                VALUES (@name, @description, @base_price, @image_url, @is_active, '[]')
            `);
            const insertBoxItem = db.prepare(`
                INSERT INTO box_items (box_template_id, product_id, quantity)
                VALUES (?, ?, 1)
            `);

            for (const box of SEED_BOX_TEMPLATES) {
                const info = insertBox.run({
                    name: box.name,
                    description: box.description,
                    base_price: box.base_price,
                    image_url: box.image_url,
                    is_active: box.is_active
                });
                const boxId = info.lastInsertRowid;
                // Link products to box
                for (const productIndex of box.items) {
                    insertBoxItem.run(boxId, productIndex);
                }
            }
            console.log(`[Rescue] Seeded ${SEED_BOX_TEMPLATES.length} box templates.`);
        }
    } catch (e) {
        console.log('[Rescue] Box template seeding failed:', e.message);
    }

    // 4. Fix config.json if images are missing or empty (Persistence Recovery)
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

            // Check Paths - fix both missing AND empty string values
            if (!config.auth.login.image || config.auth.login.image === '') {
                config.auth.login.image = '/images/login_hero.png';
                changed = true;
            }
            if (!config.auth.signup.image || config.auth.signup.image === '') {
                config.auth.signup.image = '/images/signup_hero.png';
                changed = true;
            }

            // Ensure Featured Products (Fix blank home page sections)
            if (!config.featuredProducts || config.featuredProducts.length === 0) {
                // Try to find ANY products to feature
                const anyProd = db.prepare('SELECT id FROM products LIMIT 6').all();
                if (anyProd.length > 0) {
                    config.featuredProducts = anyProd.map(p => String(p.id));
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

// Seed Admin User (Always run to ensure access)
const targetPassword = process.env.ADMIN_PASSWORD || 'password123';
if (targetPassword) {
    console.log('[Startup] Seeding Admin User...');
    try {
        const bcrypt = require('bcryptjs');
        const adminEmail = 'admin@driftlessharvest.com';
        const hashedPassword = bcrypt.hashSync(targetPassword, 10);

        let typeId = null;
        try {
            // Ensure admin_types exist (created in migration 022)
            const superAdminType = db.prepare("SELECT id FROM admin_types WHERE name = 'superadmin'").get();
            typeId = superAdminType ? superAdminType.id : null;
        } catch (e) { console.log("Warning: admin_types table missing during seed"); }

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

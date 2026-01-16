module.exports = {
    transaction: false,
    up: (db) => {
        console.log('[Migration 032] Improving User Schema - Role Hierarchy & Permissions...');

        // 1. Drop all users and related data
        console.log('  -> Dropping all users and related data...');
        db.prepare('DELETE FROM order_items').run();
        db.prepare('DELETE FROM orders').run();
        db.prepare('DELETE FROM active_carts').run();
        db.prepare('DELETE FROM addresses').run();
        db.prepare('DELETE FROM users').run();

        // 2. Improve admin_types table
        console.log('  -> Adding fields to admin_types...');

        // Check which columns already exist
        const existingColumns = db.prepare('PRAGMA table_info(admin_types)').all().map(c => c.name);

        // Add new columns only if they don't exist
        if (!existingColumns.includes('level')) {
            db.prepare('ALTER TABLE admin_types ADD COLUMN level INTEGER NOT NULL DEFAULT 0').run();
        }
        if (!existingColumns.includes('display_name')) {
            db.prepare('ALTER TABLE admin_types ADD COLUMN display_name TEXT').run();
        }
        if (!existingColumns.includes('description')) {
            db.prepare('ALTER TABLE admin_types ADD COLUMN description TEXT').run();
        }
        if (!existingColumns.includes('permissions')) {
            db.prepare('ALTER TABLE admin_types ADD COLUMN permissions TEXT').run();
        }

        // 3. Populate admin_types with proper data
        console.log('  -> Populating admin_types...');

        // Clear existing and insert with new structure
        db.prepare('DELETE FROM admin_types').run();

        const adminTypes = [
            {
                name: 'super_admin',
                display_name: 'Super Administrator',
                description: 'Full system access - can manage everything including other admins',
                level: 100,
                permissions: JSON.stringify(['*']) // Wildcard = all permissions
            },
            {
                name: 'owner',
                display_name: 'Business Owner',
                description: 'Business owner - can manage staff, products, and view all reports',
                level: 80,
                permissions: JSON.stringify(['manage_users', 'manage_products', 'manage_orders', 'view_reports', 'manage_config'])
            },
            {
                name: 'admin',
                display_name: 'Administrator',
                description: 'Administrator - can manage products, orders, and customers',
                level: 60,
                permissions: JSON.stringify(['manage_products', 'manage_orders', 'view_reports', 'manage_customers'])
            },
            {
                name: 'manager',
                display_name: 'Manager',
                description: 'Manager - can manage orders and view reports',
                level: 40,
                permissions: JSON.stringify(['manage_orders', 'view_reports'])
            },
            {
                name: 'delivery',
                display_name: 'Delivery Staff',
                description: 'Delivery staff - can view orders and update delivery status',
                level: 20,
                permissions: JSON.stringify(['view_orders', 'update_delivery_status'])
            }
        ];

        const insertType = db.prepare(`
            INSERT INTO admin_types (name, display_name, description, level, permissions)
            VALUES (?, ?, ?, ?, ?)
        `);

        adminTypes.forEach(type => {
            insertType.run(type.name, type.display_name, type.description, type.level, type.permissions);
        });

        // 4. Improve users table
        console.log('  -> Updating users table...');

        // Check if updated_at exists
        const userColumns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
        if (!userColumns.includes('updated_at')) {
            db.prepare('ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP').run();
        }

        // Make phone NOT NULL
        db.prepare('UPDATE users SET phone = \'\' WHERE phone IS NULL').run();

        // Drop redundant columns (SQLite doesn't support DROP COLUMN directly, need to recreate table)
        console.log('  -> Recreating users table without redundant columns...');

        db.prepare(`
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                phone TEXT NOT NULL DEFAULT '',
                admin_type_id INTEGER REFERENCES admin_types(id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Copy data (no users exist, but this is for safety)
        db.prepare(`
            INSERT INTO users_new (id, email, password, first_name, last_name, phone, admin_type_id, created_at, updated_at)
            SELECT id, email, password, first_name, last_name, 
                   COALESCE(phone, ''), 
                   admin_type_id, 
                   created_at, 
                   COALESCE(updated_at, CURRENT_TIMESTAMP)
            FROM users
        `).run();

        // Drop old table and rename new one
        db.prepare('DROP TABLE users').run();
        db.prepare('ALTER TABLE users_new RENAME TO users').run();

        // 5. Create indexes
        console.log('  -> Creating indexes...');
        db.prepare('CREATE INDEX IF NOT EXISTS idx_users_admin_type ON users(admin_type_id)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_admin_types_level ON admin_types(level)').run();

        // 6. Create trigger for updated_at
        console.log('  -> Creating update trigger...');
        db.prepare('DROP TRIGGER IF EXISTS update_users_timestamp').run();
        db.prepare(`
            CREATE TRIGGER update_users_timestamp 
            AFTER UPDATE ON users
            BEGIN
                UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `).run();

        // 7. Create view for easy querying
        console.log('  -> Creating users_with_roles view...');
        db.prepare('DROP VIEW IF EXISTS users_with_roles').run();
        db.prepare(`
            CREATE VIEW users_with_roles AS
            SELECT 
                u.*,
                (u.admin_type_id IS NOT NULL) as is_admin,
                (u.admin_type_id IS NULL) as is_customer,
                at.name as role_name,
                at.display_name as role_display_name,
                at.level as role_level,
                at.permissions as role_permissions,
                at.description as role_description
            FROM users u
            LEFT JOIN admin_types at ON u.admin_type_id = at.id
        `).run();

        console.log('[Migration 032] Complete!');
    }
};


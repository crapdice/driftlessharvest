module.exports = {
    up: (db) => {
        console.log('[Migration 016] Switching to Integer IDs for Inventory...');

        // NOTE: We cannot disable FKs here because MigrationRunner wraps us in a transaction.
        // We must drop tables in correct dependency order (Leaf -> Root)

        // 1. Drop Dependents First
        console.log('  -> Dropping dependent tables...');
        db.prepare("DROP TABLE IF EXISTS box_items").run();
        db.prepare("DROP TABLE IF EXISTS order_items").run();

        // 2. Drop Roots
        console.log('  -> Dropping root tables...');
        db.prepare("DROP TABLE IF EXISTS products").run();
        db.prepare("DROP TABLE IF EXISTS box_templates").run();

        // 3. Recreate Products
        console.log('  -> Creating products...');
        db.prepare(`
            CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL,
                image_url TEXT,
                tags TEXT,
                stock INTEGER DEFAULT 100,
                is_active INTEGER DEFAULT 1,
                is_archived INTEGER DEFAULT 0,
                deleted_at DATETIME DEFAULT NULL,
                farm_id TEXT DEFAULT NULL
            )
        `).run();

        // 4. Recreate Box Templates
        console.log('  -> Creating box_templates...');
        db.prepare(`
            CREATE TABLE box_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                base_price REAL NOT NULL,
                items TEXT,
                image_url TEXT,
                is_active INTEGER DEFAULT 1
            )
        `).run();

        // 5. Recreate Box Items
        console.log('  -> Creating box_items...');
        db.prepare(`
            CREATE TABLE box_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                box_template_id INTEGER NOT NULL REFERENCES box_templates(id),
                product_id INTEGER NOT NULL REFERENCES products(id),
                quantity INTEGER DEFAULT 1
            )
        `).run();

        // 6. Recreate Order Items
        console.log('  -> Creating order_items...');
        db.prepare(`
            CREATE TABLE order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL REFERENCES orders(id),
                product_id INTEGER REFERENCES products(id),
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price_at_purchase REAL NOT NULL,
                item_type TEXT DEFAULT 'product'
            )
        `).run();

        console.log('[Migration 016] Complete. Tables rebuilt with Integer IDs.');
    }
};

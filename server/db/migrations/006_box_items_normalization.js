exports.up = function (db) {
    // 1. Create box_items table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS box_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            box_template_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            FOREIGN KEY (box_template_id) REFERENCES box_templates(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `).run();

    // 2. Add deleted_at to products if not exists
    try {
        const cols = db.prepare("PRAGMA table_info(products)").all();
        if (!cols.find(c => c.name === 'deleted_at')) {
            db.prepare('ALTER TABLE products ADD COLUMN deleted_at DATETIME').run();
        }
    } catch (e) {
        console.error("Error adding deleted_at column:", e);
    }

    // 3. Migrate Data from items to box_items
    try {
        const cols = db.prepare("PRAGMA table_info(box_templates)").all();
        const jsonCol = cols.find(c => c.name === 'items_json') ? 'items_json' : 'items';

        console.log(`Migrating data using source column: ${jsonCol}`);

        const boxes = db.prepare(`SELECT id, ${jsonCol} as items_json FROM box_templates`).all();
        // Load all valid product IDs to enforce FK integrity manually before insert
        const productIds = new Set(db.prepare('SELECT id FROM products').all().map(p => p.id));

        const insertItem = db.prepare('INSERT INTO box_items (box_template_id, product_id, quantity) VALUES (?, ?, ?)');

        db.transaction(() => {
            for (const box of boxes) {
                if (!box.items_json) continue;

                let items = [];
                try {
                    items = JSON.parse(box.items_json);
                } catch (e) {
                    console.warn(`Failed to parse ${jsonCol} for box ${box.id}:`, e);
                    continue;
                }

                for (const item of items) {
                    let productId;
                    let qty = 1;

                    if (typeof item === 'string') {
                        productId = item;
                    } else if (typeof item === 'object') {
                        productId = item.id || item.productId;
                        qty = item.qty || item.quantity || 1;
                    }

                    if (productId) {
                        if (productIds.has(productId)) {
                            insertItem.run(box.id, productId, qty);
                        } else {
                            console.warn(`Skipping invalid product ID ${productId} in box ${box.id}`);
                        }
                    }
                }
            }
        })();
        console.log("Migrated box templates to box_items table.");

    } catch (e) {
        console.error("Migration failed:", e);
        throw e;
    }
};

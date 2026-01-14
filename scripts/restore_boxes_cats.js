const fs = require('fs');
const db = require('better-sqlite3')('server/db/harvest.db');

const BOXES_BACKUP = 'server/data/boxes_backup_1767996811972.json';
const CATS_BACKUP = 'server/data/categories_backup_1767996811972.json';

try {
    const restore = db.transaction(() => {
        // 1. Clear Tables
        console.log('Clearing existing data...');
        db.prepare('DELETE FROM box_items').run();
        db.prepare('DELETE FROM box_templates').run();
        db.prepare('DELETE FROM categories').run();

        // 2. Restore Categories
        if (fs.existsSync(CATS_BACKUP)) {
            const cats = JSON.parse(fs.readFileSync(CATS_BACKUP, 'utf8'));
            console.log(`Creating ${cats.length} categories...`);
            const insertCat = db.prepare('INSERT INTO categories (id, name, display_order) VALUES (@id, @name, @display_order)');
            for (const c of cats) insertCat.run(c);
        }

        // 3. Restore Boxes
        if (fs.existsSync(BOXES_BACKUP)) {
            const boxes = JSON.parse(fs.readFileSync(BOXES_BACKUP, 'utf8'));
            console.log(`Creating ${boxes.length} box templates...`);

            const insertBox = db.prepare(`
                INSERT INTO box_templates (id, name, description, base_price, image_url, items, is_active)
                VALUES (@id, @name, @description, @base_price, @image_url, @items, @is_active)
            `);
            const insertItem = db.prepare(`
                INSERT INTO box_items (box_template_id, product_id, quantity)
                VALUES (@box_template_id, @product_id, @quantity)
            `);

            for (const b of boxes) {
                // Ensure items is a string for the TEXT column
                const itemsArray = b.items || [];
                // If itemsArray is already a string (unlikely from JSON parse but possible), don't stringify again
                const itemsStr = typeof itemsArray === 'string' ? itemsArray : JSON.stringify(itemsArray);

                insertBox.run({
                    ...b,
                    items: itemsStr,
                    is_active: b.is_active !== undefined ? b.is_active : 1
                });

                // Populate box_items
                if (Array.isArray(itemsArray)) {
                    for (const item of itemsArray) {
                        insertItem.run({
                            box_template_id: b.id, // Ensure we link to this box
                            product_id: item.product_id,
                            quantity: item.quantity
                        });
                    }
                }
            }
        }
    });

    restore();
    console.log('✅ Successfully restored Boxes and Categories.');

} catch (e) {
    console.error('❌ Restore failed:', e);
}

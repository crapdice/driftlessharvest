const fs = require('fs');
const path = require('path');
const db = require('better-sqlite3')('server/db/harvest.db');

const BACKUP_FILE = 'server/data/products_backup_1767996811972.json';

try {
    console.log('Reading backup file:', BACKUP_FILE);
    const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
    const products = JSON.parse(raw);

    console.log(`Found ${products.length} products in backup.`);

    // Use transaction
    const restore = db.transaction(() => {
        console.log('Clearing existing products...');
        db.prepare('DELETE FROM products').run();

        const insert = db.prepare(`
            INSERT INTO products 
            (id, name, category, price, stock, image_url, tags, is_active, is_archived, deleted_at, farm_id)
            VALUES 
            (@id, @name, @category, @price, @stock, @image_url, @tags, @is_active, @is_archived, @deleted_at, @farm_id)
        `);

        console.log('Inserting products...');
        for (const p of products) {
            insert.run(p);
        }
    });

    restore();
    console.log('✅ Successfully restored all products.');

} catch (e) {
    console.error('❌ Restore failed:', e);
}

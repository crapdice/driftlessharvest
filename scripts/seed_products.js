const Database = require('better-sqlite3');
const path = require('path');
const db = new Database('server/db/harvest.db');

try {
    console.log('Seeding Database...');

    // 1. Seed Categories
    const catCount = db.prepare('SELECT count(*) as count FROM categories').get().count;
    if (catCount === 0) {
        console.log('Seeding categories...');
        const cats = [
            { id: 1, name: 'vegetable', display_order: 1 },
            { id: 2, name: 'fruit', display_order: 2 },
            { id: 3, name: 'protein', display_order: 3 },
            { id: 4, name: 'pantry', display_order: 4 }
        ];
        const insertCat = db.prepare('INSERT INTO categories (id, name, display_order) VALUES (@id, @name, @display_order)');
        cats.forEach(c => insertCat.run(c));
        console.log('  -> Categories seeded.');
    } else {
        console.log('  -> Categories already exist.');
    }

    // 2. Seed Products
    const productCount = db.prepare('SELECT count(*) as count FROM products').get().count;
    if (productCount === 0) {
        console.log('Seeding products...');
        const products = [
            { id: 1, name: 'Organic Kale', category: 'vegetable', price: 2.50, tags: '["organic","green"]', image_url: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=300', stock: 50, is_active: 1 },
            { id: 2, name: 'Heirloom Tomatoes', category: 'vegetable', price: 4.00, tags: '["local","seasonal"]', image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=300', stock: 30, is_active: 1 },
            { id: 3, name: 'Honeycrisp Apples', category: 'fruit', price: 3.50, tags: '["fruit","sweet"]', image_url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&q=80&w=300', stock: 100, is_active: 1 },
            { id: 4, name: 'Farm Fresh Eggs', category: 'protein', price: 6.00, tags: '["local","free-range"]', image_url: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&q=80&w=300', stock: 24, is_active: 1 },
            { id: 5, name: 'Sourdough Bread', category: 'pantry', price: 7.00, tags: '["bakery","fresh"]', image_url: 'https://images.unsplash.com/photo-1585478440055-9925d757d581?auto=format&fit=crop&q=80&w=300', stock: 15, is_active: 1 },
            { id: 6, name: 'Rainbow Carrots', category: 'vegetable', price: 3.00, tags: '["organic","root"]', image_url: 'https://images.unsplash.com/photo-1447175008436-812378a86184?auto=format&fit=crop&q=80&w=300', stock: 40, is_active: 1 },
        ];

        // Check schema to see if we need other fields (farm_id, etc)
        // Defaults should handle it.
        const insert = db.prepare('INSERT INTO products (id, name, category, price, image_url, tags, stock, is_active) VALUES (@id, @name, @category, @price, @image_url, @tags, @stock, @is_active)');
        products.forEach(p => insert.run(p));
        console.log('  -> Products seeded.');
    } else {
        console.log('  -> Products already exist.');
    }

    console.log('Done.');

} catch (e) {
    console.error('Seed Error:', e);
}

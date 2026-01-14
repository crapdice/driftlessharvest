const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'harvest.db');
const USERS_JSON = path.join(__dirname, '../data/users.json');
const ORDERS_JSON = path.join(__dirname, '../data/orders.json');

const db = new Database(DB_PATH);

console.log('Initializing database at', DB_PATH);

// 1. Schema Definition (Via Migrations)
const MigrationRunner = require('./migrations');
const runner = new MigrationRunner(db);
runner.run();

console.log('Migrations applied.');

// Seed Categories if empty
const catCount = db.prepare('SELECT count(*) as count FROM categories').get().count;
if (catCount === 0) {
  console.log('Seeding categories...');
  const cats = [
    { id: 'c1', name: 'vegetable', display_order: 1 },
    { id: 'c2', name: 'fruit', display_order: 2 },
    { id: 'c3', name: 'protein', display_order: 3 },
    { id: 'c4', name: 'pantry', display_order: 4 }
  ];
  const insertCat = db.prepare('INSERT INTO categories (id, name, display_order) VALUES (@id, @name, @display_order)');
  cats.forEach(c => insertCat.run(c));
}

console.log('Tables created.');

// Seed Products if empty
const productCount = db.prepare('SELECT count(*) as count FROM products').get().count;
if (productCount === 0) {
  console.log('Seeding products...');
  const products = [
    { id: 'p1', name: 'Organic Kale', category: 'vegetable', price: 2.50, tags: '["organic","green"]', image_url: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=300' },
    { id: 'p2', name: 'Heirloom Tomatoes', category: 'vegetable', price: 4.00, tags: '["local","seasonal"]', image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=300' },
    { id: 'p3', name: 'Honeycrisp Apples', category: 'fruit', price: 3.50, tags: '["fruit","sweet"]', image_url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&q=80&w=300' },
    { id: 'p4', name: 'Farm Fresh Eggs', category: 'protein', price: 6.00, tags: '["local","free-range"]', image_url: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&q=80&w=300' },
    { id: 'p5', name: 'Sourdough Bread', category: 'pantry', price: 7.00, tags: '["bakery","fresh"]', image_url: 'https://images.unsplash.com/photo-1585478440055-9925d757d581?auto=format&fit=crop&q=80&w=300' },
    { id: 'p6', name: 'Rainbow Carrots', category: 'vegetable', price: 3.00, tags: '["organic","root"]', image_url: 'https://images.unsplash.com/photo-1447175008436-812378a86184?auto=format&fit=crop&q=80&w=300' },
  ];

  const insert = db.prepare('INSERT INTO products (id, name, category, price, image_url, tags) VALUES (@id, @name, @category, @price, @image_url, @tags)');
  products.forEach(p => insert.run(p));
}

// 2. Migration from JSON
function migrate() {
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, email, password, address) VALUES (?, ?, ?, ?)');
  const insertOrder = db.prepare('INSERT OR IGNORE INTO orders (id, user_email, total, shipping_details, items, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)');

  // Migrate Users
  if (fs.existsSync(USERS_JSON)) {
    const users = JSON.parse(fs.readFileSync(USERS_JSON, 'utf8'));
    let count = 0;
    for (const u of users) {
      insertUser.run(u.id, u.email, u.password, JSON.stringify(u.address || {}));
      count++;
    }
    console.log(`Migrated ${count} users.`);
  }

  // Migrate Orders
  if (fs.existsSync(ORDERS_JSON)) {
    const orders = JSON.parse(fs.readFileSync(ORDERS_JSON, 'utf8'));
    let count = 0;
    for (const o of orders) {
      insertOrder.run(
        o.id,
        o.userEmail,
        o.total,
        JSON.stringify(o.shippingCoords || {}),
        JSON.stringify(o.items || []),
        o.date || new Date().toISOString(),
        'Pending'
      );
      count++;
    }
    console.log(`Migrated ${count} orders.`);
  }
}

try {
  migrate();
  console.log('Migration complete.');
} catch (err) {
  console.error('Migration failed:', err);
}

db.close();

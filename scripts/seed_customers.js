const db = require('better-sqlite3')('server/db/harvest.db');
const bcrypt = require('bcryptjs');

try {
    console.log('Seeding Customers...');

    const customers = [
        { email: 'alice@example.com', first_name: 'Alice', last_name: 'Smith', phone: '555-0101' },
        { email: 'bob@example.com', first_name: 'Bob', last_name: 'Jones', phone: '555-0102' },
        { email: 'carol@example.com', first_name: 'Carol', last_name: 'Davis', phone: '555-0103' }
    ];

    const insert = db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password, is_admin, is_customer, first_name, last_name, phone, created_at, default_address_id)
        VALUES (@id, @email, @password, 0, 1, @first_name, @last_name, @phone, @created_at, NULL)
    `);

    const hash = bcrypt.hashSync('customer123', 10);
    const now = new Date().toISOString();

    customers.forEach((c, i) => {
        insert.run({
            id: Date.now() + i,
            email: c.email,
            password: hash,
            first_name: c.first_name,
            last_name: c.last_name,
            phone: c.phone,
            created_at: now
        });
        console.log(`  -> Seeded ${c.email}`);
    });

    console.log('Done.');

} catch (e) {
    console.error('Seed Error:', e);
}

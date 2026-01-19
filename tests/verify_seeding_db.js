const db = require('../server/db');
const { userRepository } = require('../server/repositories');
const { SEED_USERS } = require('../server/db/seed_data');

async function verifySeeding() {
    console.log('='.repeat(60));
    console.log('VERBOSE SEEDING VERIFICATION');
    console.log('='.repeat(60));

    try {
        console.log('\n1. Cleaning database...');
        db.transaction(() => {
            db.prepare('DELETE FROM order_items').run();
            db.prepare('DELETE FROM orders').run();
            db.prepare('DELETE FROM active_carts').run();
            db.prepare('DELETE FROM addresses').run();
            const deleted = userRepository.deleteAllExcept('admin@driftlessharvest.com');
            console.log(`   - Deleted ${deleted} users`);
        })();

        console.log('\n2. Seeding users...');
        const insertAddress = db.prepare(`
            INSERT INTO addresses (
                user_id, user_email, name, street, city, state, zip, phone, type, is_default, first_name, last_name
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let usersCreated = 0;
        let addressesCreated = 0;

        for (const [index, userData] of SEED_USERS.entries()) {
            db.transaction(() => {
                try {
                    if (userRepository.emailExists(userData.email)) return;

                    const user = userRepository.create(userData);
                    if (!user || user.id === undefined) {
                        throw new Error(`User creation failed for ${userData.email}`);
                    }
                    usersCreated++;

                    const addrParams = [
                        user.id,
                        user.email,
                        `${userData.firstName} ${userData.lastName}`,
                        userData.street,
                        userData.city,
                        userData.state,
                        userData.zip,
                        userData.phone,
                        'shipping',
                        1,
                        userData.firstName,
                        userData.lastName
                    ];

                    insertAddress.run(...addrParams);
                    addressesCreated++;
                } catch (e) {
                    console.error(`\n[User ${index}] FAILED: ${userData.email}`);
                    console.error(`- Error: ${e.message}`);
                    throw e;
                }
            })();
        }
        console.log(`✓ Created ${usersCreated} Users and ${addressesCreated} Addresses`);

        console.log('\n3. Seeding 100 orders...');
        const users = db.prepare('SELECT id, email FROM users WHERE admin_type_id IS NULL').all();
        const products = db.prepare('SELECT id, name, price FROM products WHERE is_active = 1').all();
        const windows = db.prepare('SELECT * FROM delivery_windows WHERE is_active = 1').all();

        if (windows.length === 0) {
            console.log('   - No windows found, seeding temporary window...');
            db.prepare(`INSERT INTO delivery_windows (date_label, date_value, start_time, end_time, is_active, day_of_week) 
                       VALUES ('Test Window', '2026-01-20', '08:00', '12:00', 1, 'Tuesday')`).run();
        }

        const freshWindows = db.prepare('SELECT * FROM delivery_windows WHERE is_active = 1').all();
        const insertOrder = db.prepare(`
            INSERT INTO orders (user_id, user_email, total, status, delivery_window, items, address_id, delivery_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertOrderItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase, item_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        db.transaction(() => {
            for (let i = 0; i < 100; i++) {
                const user = users[Math.floor(Math.random() * users.length)];
                const address = db.prepare('SELECT id FROM addresses WHERE user_id = ? AND is_default = 1').get(user.id);
                const window = freshWindows[Math.floor(Math.random() * freshWindows.length)];

                const item = products[Math.floor(Math.random() * products.length)];
                const orderItemsList = [{ id: item.id, name: item.name, price: item.price, qty: 1, type: 'product' }];

                const orderResult = insertOrder.run(
                    user.id, user.email, item.price, 'Paid',
                    `${window.date_label} (${window.start_time}-${window.end_time})`,
                    JSON.stringify(orderItemsList), address ? address.id : null, window.date_value
                );

                const orderId = orderResult.lastInsertRowid;
                insertOrderItem.run(orderId, item.id, item.name, 1, item.price, 'product');
            }
        })();
        console.log('✓ 100 orders seeded successfully.');
        console.log('\n✅ SEEDING VERIFIED SUCCESSFULLY');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ VERIFICATION STOPPED:', error.message);
        process.exit(1);
    }
}

verifySeeding();

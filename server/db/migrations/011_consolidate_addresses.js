module.exports = {
    up: (db) => {
        // 1. Add default_address_id to users
        const columns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
        if (!columns.includes('default_address_id')) {
            db.prepare("ALTER TABLE users ADD COLUMN default_address_id INTEGER REFERENCES addresses(id)").run();
        }

        // 2. Migrate existing JSON blobs
        const users = db.prepare("SELECT id, email, address, first_name, last_name, phone FROM users").all();

        const insertAddress = db.prepare(`
            INSERT INTO addresses (user_email, name, street, city, zip, state, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const updateDefaultAddress = db.prepare(`
            UPDATE users SET default_address_id = ? WHERE id = ?
        `);

        for (const user of users) {
            // Only migrate if there's actual data in the blob
            if (user.address && user.address !== '{}' && user.address !== '') {
                try {
                    let addr;
                    if (typeof user.address === 'string') {
                        addr = JSON.parse(user.address);
                    } else {
                        addr = user.address;
                    }

                    // Only migrate if it has at least a street or city
                    if (addr.street || addr.city) {
                        const result = insertAddress.run(
                            user.email,
                            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User Profile',
                            addr.street || '',
                            addr.city || '',
                            addr.zip || '',
                            addr.state || 'WI',
                            user.phone || ''
                        );

                        const addressId = result.lastInsertRowid;
                        updateDefaultAddress.run(addressId, user.id);
                    }
                } catch (e) {
                    console.warn(`[Migration 011] Failed to parse address for user ${user.email}:`, e.message);
                }
            }
        }

        console.log(`[Migration 011] Address consolidation complete.`);
    }
};

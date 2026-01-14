module.exports = {
    up: (db) => {
        console.log('[Migration 015] Linking orphaned orders to users...');

        // Find orders with NULL user_id but having an email
        const orphans = db.prepare("SELECT id, user_email FROM orders WHERE user_id IS NULL AND user_email IS NOT NULL").all();

        const updateUser = db.prepare("UPDATE orders SET user_id = ? WHERE id = ?");
        const findUser = db.prepare("SELECT id FROM users WHERE email = ?");

        let fixed = 0;
        for (const order of orphans) {
            const user = findUser.get(order.user_email);
            if (user) {
                updateUser.run(user.id, order.id);
                fixed++;
            }
        }

        console.log(`[Migration 015] Complete. Linked ${fixed} orphaned orders to valid users.`);
    }
};

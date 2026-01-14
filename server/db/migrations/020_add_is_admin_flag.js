module.exports = {
    up: (db) => {
        console.log('[Migration 020] Adding is_admin flag to Users...');

        try {
            db.prepare("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0").run();
        } catch (e) {
            if (!e.message.includes('duplicate column name')) throw e;
        }

        // Migrate existing roles to flags
        db.prepare("UPDATE users SET is_admin = 1 WHERE role IN ('admin', 'super_admin')").run();
        // Everyone is a customer by default from migration 019, but ensuring it:
        // (Optional: enforce specific logic if needed, but safe to leave as 1)

        console.log('[Migration 020] Complete. Roles migrated to flags.');
    }
};

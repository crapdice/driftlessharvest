module.exports = {
    up: (db) => {
        console.log('[Migration 023] Linking Users to Admin Types...');

        // 1. Add Column
        try {
            db.prepare("ALTER TABLE users ADD COLUMN admin_type_id INTEGER REFERENCES admin_types(id)").run();
        } catch (e) {
            if (!e.message.includes('duplicate column name')) throw e;
        }

        // 2. Backfill admins
        const types = db.prepare("SELECT id, name FROM admin_types").all();
        const typeMap = {};
        types.forEach(t => typeMap[t.name] = t.id);

        console.log('  -> Admin Types Map:', typeMap);

        // Map 'admin' -> 'admin'
        if (typeMap['admin']) {
            db.prepare("UPDATE users SET admin_type_id = ? WHERE admin_role = 'admin'").run(typeMap['admin']);
        }
        // Map 'super_admin' -> 'superadmin' (Note difference in naming)
        if (typeMap['superadmin']) {
            db.prepare("UPDATE users SET admin_type_id = ? WHERE admin_role = 'super_admin'").run(typeMap['superadmin']);
        }

        console.log('[Migration 023] Complete.');
    }
};

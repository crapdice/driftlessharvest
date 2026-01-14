
module.exports = {
    up: (db) => {
        // 1. Add columns if not exist
        const columns = db.prepare("PRAGMA table_info(addresses)").all().map(c => c.name);

        if (!columns.includes('first_name')) {
            db.prepare("ALTER TABLE addresses ADD COLUMN first_name TEXT").run();
        }
        if (!columns.includes('last_name')) {
            db.prepare("ALTER TABLE addresses ADD COLUMN last_name TEXT").run();
        }

        // 2. Migrate existing 'name' data
        const addresses = db.prepare("SELECT id, name FROM addresses").all();

        const updateName = db.prepare("UPDATE addresses SET first_name = ?, last_name = ? WHERE id = ?");

        for (const addr of addresses) {
            if (addr.name) {
                const parts = addr.name.trim().split(' ');
                let first = parts[0] || '';
                let last = '';

                if (parts.length > 1) {
                    last = parts.slice(1).join(' '); // Join the rest as last name
                }

                updateName.run(first, last, addr.id);
            }
        }

        console.log(`[Migration 029] Splitting address names complete. Processed ${addresses.length} records.`);
    }
};

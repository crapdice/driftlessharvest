module.exports = {
    up: (db) => {
        // 1. Add new columns safety
        const columns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);

        if (!columns.includes('first_name')) {
            db.prepare("ALTER TABLE users ADD COLUMN first_name TEXT").run();
        }
        if (!columns.includes('last_name')) {
            db.prepare("ALTER TABLE users ADD COLUMN last_name TEXT").run();
        }
    }
};

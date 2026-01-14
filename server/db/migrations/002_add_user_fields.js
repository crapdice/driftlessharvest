exports.up = function (db) {
    // Add role if missing
    try {
        const columns = db.prepare("PRAGMA table_info(users)").all();
        if (!columns.find(c => c.name === 'role')) {
            db.prepare('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"').run();
        }
    } catch (e) {
        console.warn("Migration 002: Failed to add role column", e);
    }

    // Add phone if missing
    try {
        const columns = db.prepare("PRAGMA table_info(users)").all();
        if (!columns.find(c => c.name === 'phone')) {
            db.prepare('ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ""').run();
        }
    } catch (e) {
        console.warn("Migration 002: Failed to add phone column", e);
    }
}

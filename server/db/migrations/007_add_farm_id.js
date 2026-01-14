exports.up = function (db) {
    try {
        const cols = db.prepare("PRAGMA table_info(products)").all();
        if (!cols.find(c => c.name === 'farm_id')) {
            db.prepare('ALTER TABLE products ADD COLUMN farm_id TEXT').run();
        }
    } catch (e) {
        console.error("Migration 007 failed:", e);
    }
}

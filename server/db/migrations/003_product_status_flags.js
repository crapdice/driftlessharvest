exports.up = function (db) {
    // Products: is_active
    try {
        const cols = db.prepare("PRAGMA table_info(products)").all();
        if (!cols.find(c => c.name === 'is_active')) {
            db.prepare('ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1').run();
        }
        if (!cols.find(c => c.name === 'is_archived')) {
            db.prepare('ALTER TABLE products ADD COLUMN is_archived INTEGER DEFAULT 0').run();
        }
    } catch (e) { }

    // Box Templates: is_active
    try {
        const cols = db.prepare("PRAGMA table_info(box_templates)").all();
        if (!cols.find(c => c.name === 'is_active')) {
            db.prepare('ALTER TABLE box_templates ADD COLUMN is_active INTEGER DEFAULT 1').run();
        }
        // Ensure image_url exists
        if (!cols.find(c => c.name === 'image_url')) {
            db.prepare('ALTER TABLE box_templates ADD COLUMN image_url TEXT').run();
        }
    } catch (e) { }
}

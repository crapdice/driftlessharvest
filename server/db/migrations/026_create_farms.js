module.exports = {
    up: (db) => {
        console.log('[Migration 026] Creating farms table...');

        // 1. Create Farms Table
        // Users asked for: id, farm_name, farm_description, owner_name, farm_address, farm_phone, farm_email, farm_type, farm_id
        db.prepare(`
            CREATE TABLE IF NOT EXISTS farms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farm_name TEXT NOT NULL,
                farm_description TEXT,
                owner_name TEXT,
                farm_address TEXT,
                farm_phone TEXT,
                farm_email TEXT,
                farm_type TEXT,
                farm_id TEXT UNIQUE -- Public ID / Slug, mapped to products.farm_id
            )
        `).run();

        console.log('  -> Table created.');

        // 2. Index for performance on the lookup column
        try {
            db.prepare("CREATE INDEX IF NOT EXISTS idx_farms_farm_id ON farms(farm_id)").run();
        } catch (e) { }

        // 3. Verify products link (User said it is already mapped, confirmed column exists as TEXT)
        // No ALTER needed for products if column exists.

        console.log('[Migration 026] Complete.');
    }
};

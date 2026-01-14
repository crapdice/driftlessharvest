exports.up = function (db) {
    // Users Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Products Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT,
            image_url TEXT,
            stock INTEGER DEFAULT 0,
            description TEXT
        )
    `).run();

    // Orders Table (Base)
    db.prepare(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            items TEXT NOT NULL, -- JSON Blob (Legacy)
            total REAL NOT NULL,
            shipping_details TEXT, -- JSON Blob (Legacy)
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Pending'
        )
    `).run();

    // Box Templates
    db.prepare(`
        CREATE TABLE IF NOT EXISTS box_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            base_price REAL NOT NULL,
            items_json TEXT,
            description TEXT
        )
    `).run();

    // Delivery Windows
    db.prepare(`
        CREATE TABLE IF NOT EXISTS delivery_windows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_of_week TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            capacity INTEGER DEFAULT 10
        )
    `).run();
}

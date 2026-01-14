module.exports = {
    up: (db) => {
        db.prepare(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                stripe_payment_id TEXT UNIQUE,
                amount INTEGER,
                currency TEXT DEFAULT 'usd',
                status TEXT,
                receipt_email TEXT,
                raw_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        `).run();

        // Index for fast lookups by order
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`).run();
        // Index for fast lookups by stripe ID
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_id)`).run();
    }
};

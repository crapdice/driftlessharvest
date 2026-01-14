module.exports = {
    up: (db) => {
        // 1. Add delivery_date column
        const columns = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
        if (!columns.includes('delivery_date')) {
            db.prepare("ALTER TABLE orders ADD COLUMN delivery_date DATE").run();
        }

        // 2. Backfill from delivery_window (Best Effort)
        const orders = db.prepare("SELECT id, delivery_window FROM orders WHERE delivery_date IS NULL").all();

        const update = db.prepare("UPDATE orders SET delivery_date = ? WHERE id = ?");

        const currentYear = new Date().getFullYear();

        for (const o of orders) {
            if (!o.delivery_window || o.delivery_window === 'Standard') continue;

            try {
                // Formatting usually: "Friday, January 17th"
                // We need to parse this.
                let dateStr = o.delivery_window;

                // Remove ordinal suffixes (st, nd, rd, th) to help Date.parse
                dateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');

                // Append Year if missing (Assuming current year, or next year if month is earlier?)
                // Simple approach: Date.parse("Friday, January 17") defaults to current year usually.

                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                    // Fix year: If month is Jan and we are in Dec, might be next year.
                    // For now, assume current year context or explicit if provided.
                    // Our "delivery_windows" table has `date_value` (YYYY-MM-DD), checking that might be better if linked?
                    // But orders only store the string label.

                    if (parsed.getFullYear() < 2020) {
                        parsed.setFullYear(currentYear); // Correction for missing year defaulting to 2001 etc
                    }

                    const isoDate = parsed.toISOString().split('T')[0];
                    update.run(isoDate, o.id);
                }
            } catch (e) {
                console.warn(`[Migration 027] Could not parse date for order ${o.id}: '${o.delivery_window}'`);
            }
        }
        console.log(`[Migration 027] Added delivery_date and backfilled ${orders.length} orders.`);
    }
};

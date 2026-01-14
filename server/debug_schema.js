const db = require('./db');

console.log("1. Checking Users Table Schema...");
try {
    const cols = db.prepare("PRAGMA table_info(users)").all();
    console.log("Columns:", cols.map(c => c.name).join(", "));
} catch (e) { console.error("Pragma failed:", e.message); }

console.log("\n2. Testing SELECT Query...");
try {
    // This is the query causing issues
    const stmt = db.prepare(`
        SELECT id, email, phone, role, first_name, last_name, default_address_id
        FROM users 
        LIMIT 1
    `);
    console.log("Query prepared successfully.");
    const user = stmt.get();
    console.log("Result:", user);
} catch (e) {
    console.error("QUERY FAILED:", e.message);
}

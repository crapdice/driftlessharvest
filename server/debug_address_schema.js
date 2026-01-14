const db = require('./db');

console.log("=== ADDRESSES TABLE SCHEMA ===");
try {
    const cols = db.prepare("PRAGMA table_info(addresses)").all();
    console.table(cols);
} catch (e) {
    console.error("Failed to check addresses schema:", e.message);
}

console.log("\n=== USERS TABLE SCHEMA ===");
try {
    const cols = db.prepare("PRAGMA table_info(users)").all();
    console.table(cols);
} catch (e) {
    console.error("Failed to check users schema:", e.message);
}

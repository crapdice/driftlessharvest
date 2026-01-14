const db = require('./db');

function printSchema(tableName) {
    console.log(`\n=== ${tableName.toUpperCase()} SCHEMA ===`);
    try {
        const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
        console.log(JSON.stringify(cols, null, 2));
    } catch (e) {
        console.error(`Failed to check ${tableName}:`, e.message);
    }
}

printSchema('addresses');
printSchema('users');

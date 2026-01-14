const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'server/db/harvest.db'));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

tables.forEach(table => {
    console.log(`\nSchema for ${table.name}:`);
    const cols = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.table(cols);
});

db.close();

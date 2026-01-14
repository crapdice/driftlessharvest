const Database = require('better-sqlite3');
const db = new Database('server/db/harvest.db');
const cols = db.prepare("PRAGMA table_info(box_templates)").all();
console.log(cols);

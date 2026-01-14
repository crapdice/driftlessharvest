const db = require('better-sqlite3')('server/db/harvest.db');
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%REFERENCES products%'").all();
console.log('Tables referencing products:', tables.map(t => t.name));

const boxTables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%REFERENCES box_templates%'").all();
console.log('Tables referencing box_templates:', boxTables.map(t => t.name));

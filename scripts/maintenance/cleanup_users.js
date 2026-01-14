
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'server/db/harvest.db');
const db = new Database(dbPath);

try {
    const keepIds = ['780182', '702528'];
    // Assuming IDs are strings. If integers, remove quotes in query or handle appropriately.
    // The instructions say "userID", usually these are strings in this app.

    const info = db.prepare(`DELETE FROM users WHERE id NOT IN (${keepIds.map(id => `'${id}'`).join(',')})`).run();
    console.log(`Deleted ${info.changes} users.`);

    const remaining = db.prepare('SELECT id, email FROM users').all();
    console.log('Remaining users:', remaining);
} catch (e) {
    console.error(e);
}

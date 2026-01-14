const fs = require('fs');
const db = require('better-sqlite3')('server/db/harvest.db');

const BOXES_BACKUP = 'server/data/boxes_backup_1767996811972.json';
const CATS_BACKUP = 'server/data/categories_backup_1767996811972.json';

function check(name, backupPath, tableName) {
    console.log(`\n--- Checking ${name} ---`);
    if (!fs.existsSync(backupPath)) {
        console.error(`Backup file missing: ${backupPath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    if (data.length === 0) {
        console.log(`Backup is empty.`);
        return;
    }

    console.log(`Backup Sample Keys:`, JSON.stringify(Object.keys(data[0])));

    const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
    console.log(`DB Columns:`, JSON.stringify(cols.map(c => c.name)));

    // Check strict match
    const dbColNames = cols.map(c => c.name);
    const backupKeys = Object.keys(data[0]);

    // Note: backup might have extra keys (like join data) or missing optional keys.
    // We mainly care that DB has columns for backup data.
    const missingInDB = backupKeys.filter(k => !dbColNames.includes(k));

    if (missingInDB.length > 0) {
        console.warn(`WARNING: Backup info '${missingInDB.join(', ')}' has no matching DB column.`);
    } else {
        console.log(`✅ Schema Compatible.`);
    }
}

check('Boxes', BOXES_BACKUP, 'box_templates');
check('Categories', CATS_BACKUP, 'categories');

const boxData = JSON.parse(fs.readFileSync(BOXES_BACKUP, 'utf8'));
if (boxData[0].items) {
    console.log(`\nBox Items Analysis:`);
    console.log(`Type:`, typeof boxData[0].items);
    console.log(`Is Array?`, Array.isArray(boxData[0].items));
    console.log(`Sample content:`, JSON.stringify(boxData[0].items).substring(0, 100));
}

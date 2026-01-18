const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const MigrationRunner = require('../server/db/migrations');

// Determine DB path (mimicking server/db/index.js)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../server/db');
const DB_PATH = path.join(DATA_DIR, 'harvest.db');

console.log(`Connecting to database at: ${DB_PATH}`);

if (!fs.existsSync(DB_PATH)) {
    console.error('Database file not found!');
    process.exit(1);
}

const db = new Database(DB_PATH);
const runner = new MigrationRunner(db);

// Override migrationsDir because it's relative to MigrationRunner's location
runner.migrationsDir = path.join(__dirname, '../server/db/migrations');

try {
    runner.run();
    console.log('Migrations completed successfully.');
} catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
} finally {
    db.close();
}

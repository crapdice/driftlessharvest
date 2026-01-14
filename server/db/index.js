const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const MigrationRunner = require('./migrations');

// Use DATA_DIR if provided (Railway Volume), else default to local dir
const DATA_DIR = process.env.DATA_DIR || __dirname;
// Ensure directory exists if it's a custom path
if (process.env.DATA_DIR && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'harvest.db');
const db = new Database(DB_PATH);

// Initialize & Run Migrations
const runner = new MigrationRunner(db);
runner.run();

module.exports = db;

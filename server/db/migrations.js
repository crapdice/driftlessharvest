const fs = require('fs');
const path = require('path');

class MigrationRunner {
    constructor(db) {
        this.db = db;
        this.migrationsTable = 'migrations';
        this.migrationsDir = path.join(__dirname, 'migrations');
    }

    init() {
        // Ensure migrations table exists
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
    }

    getApplied() {
        try {
            return this.db.prepare(`SELECT name FROM ${this.migrationsTable}`).all().map(r => r.name);
        } catch (e) {
            return [];
        }
    }

    run() {
        this.init();
        const applied = new Set(this.getApplied());

        if (!fs.existsSync(this.migrationsDir)) {
            console.warn(`Migration directory not found at ${this.migrationsDir}`);
            return;
        }

        const files = fs.readdirSync(this.migrationsDir)
            .filter(f => f.endsWith('.js')) // Using JS for robustness/logic
            .sort(); // Ensure alphanumeric sort (001, 002, etc.)

        let count = 0;
        for (const file of files) {
            if (!applied.has(file)) {
                console.log(`Running migration: ${file}`);
                try {
                    const migration = require(path.join(this.migrationsDir, file));

                    // Transactional execution logic
                    if (migration.transaction === false) {
                        if (migration.up) migration.up(this.db);
                    } else {
                        const runMigration = this.db.transaction(() => {
                            if (migration.up) migration.up(this.db);
                        });
                        runMigration();
                    }

                    // Record success
                    this.db.prepare(`INSERT INTO ${this.migrationsTable} (name) VALUES (?)`).run(file);
                    console.log(`  -> Success: ${file}`);
                    count++;
                } catch (e) {
                    console.error(`  -> FAILED: ${file}`, e);
                    throw e; // Stop execution on failure
                }
            }
        }

        if (count > 0) console.log(`Applied ${count} new migrations.`);
        else console.log('Database schema is up to date.');
    }
}

module.exports = MigrationRunner;

/**
 * SqliteAdapter - SQLite implementation of DatabaseAdapter
 * 
 * Wraps better-sqlite3 to provide a consistent interface that can be
 * swapped for PostgresAdapter during migration.
 */

const DatabaseAdapter = require('./DatabaseAdapter');

class SqliteAdapter extends DatabaseAdapter {
    /**
     * @param {Object} db - better-sqlite3 database instance
     */
    constructor(db) {
        super();
        this._db = db;
        this._preparedStatements = new Map();
    }

    /**
     * Get the raw better-sqlite3 instance (for migrations, etc.)
     */
    get raw() {
        return this._db;
    }

    get type() {
        return 'sqlite';
    }

    all(sql, params = []) {
        return this._db.prepare(sql).all(...params);
    }

    get(sql, params = []) {
        return this._db.prepare(sql).get(...params);
    }

    run(sql, params = []) {
        const result = this._db.prepare(sql).run(...params);
        return {
            changes: result.changes,
            lastInsertRowid: result.lastInsertRowid
        };
    }

    prepare(sql) {
        // Cache prepared statements for performance
        if (!this._preparedStatements.has(sql)) {
            this._preparedStatements.set(sql, this._db.prepare(sql));
        }
        const stmt = this._preparedStatements.get(sql);

        // Return wrapper that matches our interface
        return {
            all: (...params) => stmt.all(...params),
            get: (...params) => stmt.get(...params),
            run: (...params) => {
                const result = stmt.run(...params);
                return {
                    changes: result.changes,
                    lastInsertRowid: result.lastInsertRowid
                };
            }
        };
    }

    transaction(fn) {
        // better-sqlite3 transaction returns a function
        const transactionFn = this._db.transaction(fn);
        return transactionFn();
    }

    close() {
        this._preparedStatements.clear();
        this._db.close();
    }
}

module.exports = SqliteAdapter;

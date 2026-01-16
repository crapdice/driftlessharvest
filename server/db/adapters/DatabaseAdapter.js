/**
 * DatabaseAdapter - Abstract base class for database operations
 * 
 * This abstraction layer allows swapping database backends (SQLite, PostgreSQL)
 * without changing repository code.
 * 
 * Usage:
 *   const adapter = new SqliteAdapter(db);
 *   const user = adapter.get('SELECT * FROM users WHERE id = ?', [1]);
 */

class DatabaseAdapter {
    /**
     * Execute a query that returns multiple rows
     * @param {string} sql - SQL query with ? placeholders
     * @param {Array} params - Parameters to bind
     * @returns {Array} Array of row objects
     */
    all(sql, params = []) {
        throw new Error('all() must be implemented by subclass');
    }

    /**
     * Execute a query that returns a single row
     * @param {string} sql - SQL query with ? placeholders
     * @param {Array} params - Parameters to bind
     * @returns {Object|null} Single row object or null
     */
    get(sql, params = []) {
        throw new Error('get() must be implemented by subclass');
    }

    /**
     * Execute a query that modifies data (INSERT, UPDATE, DELETE)
     * @param {string} sql - SQL query with ? placeholders
     * @param {Array} params - Parameters to bind
     * @returns {Object} Result with { changes, lastInsertRowid }
     */
    run(sql, params = []) {
        throw new Error('run() must be implemented by subclass');
    }

    /**
     * Prepare a statement for repeated execution (performance optimization)
     * @param {string} sql - SQL query with ? placeholders
     * @returns {Object} Prepared statement object with run(), get(), all() methods
     */
    prepare(sql) {
        throw new Error('prepare() must be implemented by subclass');
    }

    /**
     * Execute multiple operations in a transaction
     * @param {Function} fn - Function containing database operations
     * @returns {*} Result of the function
     */
    transaction(fn) {
        throw new Error('transaction() must be implemented by subclass');
    }

    /**
     * Get database type identifier
     * @returns {string} 'sqlite' or 'postgres'
     */
    get type() {
        throw new Error('type getter must be implemented by subclass');
    }

    /**
     * Close the database connection
     */
    close() {
        throw new Error('close() must be implemented by subclass');
    }
}

module.exports = DatabaseAdapter;

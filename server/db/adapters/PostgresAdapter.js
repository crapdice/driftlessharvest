/**
 * PostgresAdapter - PostgreSQL implementation of DatabaseAdapter
 * 
 * STUB: This is a placeholder for future PostgreSQL support.
 * Implement this class when ready to migrate from SQLite.
 * 
 * Required: npm install pg
 * 
 * Example usage:
 *   const { Pool } = require('pg');
 *   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *   const adapter = new PostgresAdapter(pool);
 */

const DatabaseAdapter = require('./DatabaseAdapter');

class PostgresAdapter extends DatabaseAdapter {
    /**
     * @param {Object} pool - pg Pool instance
     */
    constructor(pool) {
        super();
        this._pool = pool;
        console.warn('[PostgresAdapter] This is a stub implementation. Complete before production use.');
    }

    get type() {
        return 'postgres';
    }

    get raw() {
        return this._pool;
    }

    async all(sql, params = []) {
        // Convert ? placeholders to $1, $2, etc.
        const pgSql = this._convertPlaceholders(sql);
        const result = await this._pool.query(pgSql, params);
        return result.rows;
    }

    async get(sql, params = []) {
        const rows = await this.all(sql, params);
        return rows[0] || null;
    }

    async run(sql, params = []) {
        const pgSql = this._convertPlaceholders(sql);
        const result = await this._pool.query(pgSql, params);
        return {
            changes: result.rowCount,
            lastInsertRowid: result.rows[0]?.id || null // Requires RETURNING id
        };
    }

    prepare(sql) {
        // PostgreSQL doesn't have persistent prepared statements in the same way
        // Return an object that mimics the interface but executes immediately
        const pgSql = this._convertPlaceholders(sql);
        const pool = this._pool;

        return {
            all: async (...params) => {
                const result = await pool.query(pgSql, params);
                return result.rows;
            },
            get: async (...params) => {
                const result = await pool.query(pgSql, params);
                return result.rows[0] || null;
            },
            run: async (...params) => {
                const result = await pool.query(pgSql, params);
                return {
                    changes: result.rowCount,
                    lastInsertRowid: result.rows[0]?.id || null
                };
            }
        };
    }

    async transaction(fn) {
        const client = await this._pool.connect();
        try {
            await client.query('BEGIN');
            const result = await fn(client);
            await client.query('COMMIT');
            return result;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async close() {
        await this._pool.end();
    }

    /**
     * Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
     * @param {string} sql - SQL with ? placeholders
     * @returns {string} SQL with $n placeholders
     */
    _convertPlaceholders(sql) {
        let index = 0;
        return sql.replace(/\?/g, () => `$${++index}`);
    }

    /**
     * Convert SQLite datetime('now') to PostgreSQL NOW()
     * @param {string} sql - SQL query
     * @returns {string} Converted SQL
     */
    _convertDateFunctions(sql) {
        return sql
            .replace(/datetime\('now'\)/gi, 'NOW()')
            .replace(/date\('now'\)/gi, 'CURRENT_DATE')
            .replace(/DATETIME/gi, 'TIMESTAMP');
    }
}

module.exports = PostgresAdapter;

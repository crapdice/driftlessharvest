/**
 * Database Adapters Index
 * 
 * Exports all database adapter classes for easy importing.
 */

const DatabaseAdapter = require('./DatabaseAdapter');
const SqliteAdapter = require('./SqliteAdapter');
const PostgresAdapter = require('./PostgresAdapter');

module.exports = {
    DatabaseAdapter,
    SqliteAdapter,
    PostgresAdapter
};

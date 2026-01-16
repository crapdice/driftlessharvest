/**
 * Repository Index
 * 
 * Centralized access to all repository classes.
 * Initialize once and export singleton instances.
 */

const db = require('../db');
const UserRepository = require('./UserRepository');

// Export singleton instances
const userRepository = new UserRepository(db);

module.exports = {
    userRepository,
    // Add other repositories here as needed:
    // orderRepository,
    // productRepository,
    // addressRepository,
};

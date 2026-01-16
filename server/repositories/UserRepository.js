/**
 * UserRepository - Centralized data access layer for users
 * 
 * All user database operations go through this class.
 * Provides prepared statement caching for performance.
 */

const bcrypt = require('bcryptjs');

class UserRepository {
    constructor(db) {
        this.db = db;
        this._initStatements();
    }

    /**
     * Initialize and cache prepared statements for performance
     */
    _initStatements() {
        this.stmts = {
            // Read operations
            findById: this.db.prepare(`
                SELECT u.*, at.name as role_name, at.display_name as role_display_name, 
                       at.level as role_level, at.permissions as role_permissions
                FROM users u
                LEFT JOIN admin_types at ON u.admin_type_id = at.id
                WHERE u.id = ?
            `),
            findByEmail: this.db.prepare(`
                SELECT u.*, at.name as role_name, at.display_name as role_display_name,
                       at.level as role_level, at.permissions as role_permissions
                FROM users u
                LEFT JOIN admin_types at ON u.admin_type_id = at.id
                WHERE u.email = ?
            `),
            list: this.db.prepare(`
                SELECT u.*, at.name as role_name, at.display_name as role_display_name,
                       at.level as role_level
                FROM users u
                LEFT JOIN admin_types at ON u.admin_type_id = at.id
                ORDER BY u.created_at DESC
            `),
            listCustomers: this.db.prepare(`
                SELECT u.*, at.name as role_name
                FROM users u
                LEFT JOIN admin_types at ON u.admin_type_id = at.id
                WHERE u.admin_type_id IS NULL
                ORDER BY u.created_at DESC
            `),
            listAdmins: this.db.prepare(`
                SELECT u.*, at.name as role_name, at.display_name as role_display_name,
                       at.level as role_level
                FROM users u
                LEFT JOIN admin_types at ON u.admin_type_id = at.id
                WHERE u.admin_type_id IS NOT NULL
                ORDER BY at.level DESC, u.created_at DESC
            `),
            count: this.db.prepare('SELECT COUNT(*) as count FROM users'),
            countCustomers: this.db.prepare('SELECT COUNT(*) as count FROM users WHERE admin_type_id IS NULL'),
            countAdmins: this.db.prepare('SELECT COUNT(*) as count FROM users WHERE admin_type_id IS NOT NULL'),

            // Write operations
            create: this.db.prepare(`
                INSERT INTO users (email, password, first_name, last_name, phone, admin_type_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `),
            update: this.db.prepare(`
                UPDATE users 
                SET email = ?, first_name = ?, last_name = ?, phone = ?, admin_type_id = ?, updated_at = datetime('now')
                WHERE id = ?
            `),
            updatePassword: this.db.prepare(`
                UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?
            `),
            delete: this.db.prepare('DELETE FROM users WHERE id = ?'),
            deleteCustomers: this.db.prepare('DELETE FROM users WHERE admin_type_id IS NULL'),
            deleteAll: this.db.prepare('DELETE FROM users WHERE email != ?'),

            // Admin type operations
            getAdminTypeByName: this.db.prepare('SELECT * FROM admin_types WHERE name = ?'),
            getAdminTypeById: this.db.prepare('SELECT * FROM admin_types WHERE id = ?'),
            listAdminTypes: this.db.prepare('SELECT * FROM admin_types ORDER BY level DESC'),
        };
    }

    // ==================== READ OPERATIONS ====================

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Object|null} User object or null
     */
    findById(id) {
        return this.stmts.findById.get(id) || null;
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Object|null} User object or null
     */
    findByEmail(email) {
        return this.stmts.findByEmail.get(email) || null;
    }

    /**
     * Check if email exists
     * @param {string} email - Email to check
     * @returns {boolean}
     */
    emailExists(email) {
        return this.findByEmail(email) !== null;
    }

    /**
     * List all users
     * @returns {Array} Array of user objects
     */
    list() {
        return this.stmts.list.all();
    }

    /**
     * List customers only (non-admin users)
     * @returns {Array}
     */
    listCustomers() {
        return this.stmts.listCustomers.all();
    }

    /**
     * List admin users only
     * @returns {Array}
     */
    listAdmins() {
        return this.stmts.listAdmins.all();
    }

    /**
     * Get user count
     * @returns {number}
     */
    count() {
        return this.stmts.count.get().count;
    }

    /**
     * Get customer count
     * @returns {number}
     */
    countCustomers() {
        return this.stmts.countCustomers.get().count;
    }

    /**
     * Get admin count
     * @returns {number}
     */
    countAdmins() {
        return this.stmts.countAdmins.get().count;
    }

    // ==================== WRITE OPERATIONS ====================

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @param {string} userData.email - Email (required)
     * @param {string} userData.password - Plain text password (required)
     * @param {string} [userData.firstName] - First name
     * @param {string} [userData.lastName] - Last name
     * @param {string} [userData.phone] - Phone number
     * @param {number} [userData.adminTypeId] - Admin type ID (null for customer)
     * @returns {Object} Created user with ID
     */
    create(userData) {
        const { email, password, firstName, lastName, phone, adminTypeId } = userData;

        // Validate required fields
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Check for duplicate email
        if (this.emailExists(email)) {
            throw new Error('Email already exists');
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insert user
        const result = this.stmts.create.run(
            email,
            hashedPassword,
            firstName || null,
            lastName || null,
            phone || '',
            adminTypeId || null
        );

        return this.findById(result.lastInsertRowid);
    }

    /**
     * Update user (excluding password)
     * @param {number} id - User ID
     * @param {Object} userData - Fields to update
     * @returns {Object} Updated user
     */
    update(id, userData) {
        const existing = this.findById(id);
        if (!existing) {
            throw new Error('User not found');
        }

        const { email, firstName, lastName, phone, adminTypeId } = userData;

        // Check email uniqueness if changing email
        if (email && email !== existing.email && this.emailExists(email)) {
            throw new Error('Email already exists');
        }

        this.stmts.update.run(
            email || existing.email,
            firstName !== undefined ? firstName : existing.first_name,
            lastName !== undefined ? lastName : existing.last_name,
            phone !== undefined ? phone : existing.phone,
            adminTypeId !== undefined ? adminTypeId : existing.admin_type_id,
            id
        );

        return this.findById(id);
    }

    /**
     * Update user password
     * @param {number} id - User ID
     * @param {string} newPassword - New plain text password
     * @returns {boolean} Success
     */
    updatePassword(id, newPassword) {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const result = this.stmts.updatePassword.run(hashedPassword, id);
        return result.changes > 0;
    }

    /**
     * Delete user by ID (simple delete, no cleanup)
     * @param {number} id - User ID
     * @returns {boolean} Success
     */
    delete(id) {
        const result = this.stmts.delete.run(id);
        return result.changes > 0;
    }

    /**
     * Delete user and all related data atomically
     * Cleans up: addresses, active_carts, then user
     * @param {number} id - User ID
     * @returns {Object} { success: boolean, deleted: { addresses, carts, user } }
     */
    deleteWithRelated(id) {
        const deleteAddresses = this.db.prepare('DELETE FROM addresses WHERE user_id = ?');
        const deleteCarts = this.db.prepare('DELETE FROM active_carts WHERE user_id = ?');

        const deleteTransaction = this.db.transaction((userId) => {
            const addresses = deleteAddresses.run(userId);
            const carts = deleteCarts.run(userId);
            const user = this.stmts.delete.run(userId);

            return {
                success: user.changes > 0,
                deleted: {
                    addresses: addresses.changes,
                    carts: carts.changes,
                    user: user.changes
                }
            };
        });

        return deleteTransaction(id);
    }

    /**
     * Delete all customers (non-admin users) - simple delete
     * @returns {number} Number of deleted users
     */
    deleteAllCustomers() {
        const result = this.stmts.deleteCustomers.run();
        return result.changes;
    }

    /**
     * Delete all customers and their related data atomically
     * Cleans up: addresses, active_carts, order_items, orders, then users
     * @returns {Object} Deletion counts for each table
     */
    deleteAllCustomersWithRelated() {
        const deleteTransaction = this.db.transaction(() => {
            // Get customer IDs first
            const customerIds = this.db.prepare('SELECT id FROM users WHERE admin_type_id IS NULL').all().map(u => u.id);

            if (customerIds.length === 0) {
                return { users: 0, addresses: 0, carts: 0, orders: 0, orderItems: 0 };
            }

            const placeholders = customerIds.map(() => '?').join(',');

            // Delete related data in correct order (foreign keys)
            const orderItems = this.db.prepare(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (${placeholders}))`).run(...customerIds);
            const orders = this.db.prepare(`DELETE FROM orders WHERE user_id IN (${placeholders})`).run(...customerIds);
            const carts = this.db.prepare(`DELETE FROM active_carts WHERE user_id IN (${placeholders})`).run(...customerIds);
            const addresses = this.db.prepare(`DELETE FROM addresses WHERE user_id IN (${placeholders})`).run(...customerIds);
            const users = this.stmts.deleteCustomers.run();

            return {
                users: users.changes,
                addresses: addresses.changes,
                carts: carts.changes,
                orders: orders.changes,
                orderItems: orderItems.changes
            };
        });

        return deleteTransaction();
    }

    /**
     * Delete all users except specified email (with related data cleanup)
     * @param {string} preserveEmail - Email to preserve (usually admin)
     * @returns {Object} Deletion counts
     */
    deleteAllExceptWithRelated(preserveEmail) {
        const deleteTransaction = this.db.transaction(() => {
            // Get IDs of users to delete
            const userIds = this.db.prepare('SELECT id FROM users WHERE email != ?').all(preserveEmail).map(u => u.id);

            if (userIds.length === 0) {
                return { users: 0, addresses: 0, carts: 0, orders: 0, orderItems: 0 };
            }

            const placeholders = userIds.map(() => '?').join(',');

            // Delete related data in correct order
            const orderItems = this.db.prepare(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (${placeholders}))`).run(...userIds);
            const orders = this.db.prepare(`DELETE FROM orders WHERE user_id IN (${placeholders})`).run(...userIds);
            const carts = this.db.prepare(`DELETE FROM active_carts WHERE user_id IN (${placeholders})`).run(...userIds);
            const addresses = this.db.prepare(`DELETE FROM addresses WHERE user_id IN (${placeholders})`).run(...userIds);
            const users = this.stmts.deleteAll.run(preserveEmail);

            return {
                users: users.changes,
                addresses: addresses.changes,
                carts: carts.changes,
                orders: orders.changes,
                orderItems: orderItems.changes
            };
        });

        return deleteTransaction();
    }

    /**
     * Delete all users except specified email (simple, no cleanup)
     * @param {string} preserveEmail - Email to preserve (usually admin)
     * @returns {number} Number of deleted users
     */
    deleteAllExcept(preserveEmail) {
        const result = this.stmts.deleteAll.run(preserveEmail);
        return result.changes;
    }

    /**
     * Run multiple operations in a transaction
     * @param {Function} fn - Function containing database operations
     * @returns {*} Result of the function
     */
    transaction(fn) {
        return this.db.transaction(fn)();
    }

    // ==================== AUTHENTICATION ====================

    /**
     * Authenticate user by email and password
     * @param {string} email - User email
     * @param {string} password - Plain text password
     * @returns {Object|null} User object if authenticated, null otherwise
     */
    authenticate(email, password) {
        const user = this.findByEmail(email);
        if (!user) {
            return null;
        }

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            return null;
        }

        return user;
    }

    /**
     * Check if user is admin
     * @param {Object|number} userOrId - User object or user ID
     * @returns {boolean}
     */
    isAdmin(userOrId) {
        const user = typeof userOrId === 'number' ? this.findById(userOrId) : userOrId;
        return user && user.admin_type_id !== null;
    }

    /**
     * Check if user has minimum role level
     * @param {Object|number} userOrId - User object or user ID
     * @param {number} minLevel - Minimum role level required
     * @returns {boolean}
     */
    hasMinLevel(userOrId, minLevel) {
        const user = typeof userOrId === 'number' ? this.findById(userOrId) : userOrId;
        return user && user.role_level >= minLevel;
    }

    /**
     * Check if user has specific permission
     * @param {Object|number} userOrId - User object or user ID
     * @param {string} permission - Permission to check
     * @returns {boolean}
     */
    hasPermission(userOrId, permission) {
        const user = typeof userOrId === 'number' ? this.findById(userOrId) : userOrId;
        if (!user || !user.role_permissions) {
            return false;
        }

        try {
            const permissions = JSON.parse(user.role_permissions);
            return permissions.includes('*') || permissions.includes(permission);
        } catch {
            return false;
        }
    }

    // ==================== ADMIN TYPE OPERATIONS ====================

    /**
     * Get admin type by name
     * @param {string} name - Admin type name (e.g., 'super_admin', 'admin')
     * @returns {Object|null}
     */
    getAdminType(name) {
        return this.stmts.getAdminTypeByName.get(name) || null;
    }

    /**
     * Get admin type by ID
     * @param {number} id - Admin type ID
     * @returns {Object|null}
     */
    getAdminTypeById(id) {
        return this.stmts.getAdminTypeById.get(id) || null;
    }

    /**
     * List all admin types
     * @returns {Array}
     */
    listAdminTypes() {
        return this.stmts.listAdminTypes.all();
    }

    // ==================== SEED/UTILITY OPERATIONS ====================

    /**
     * Create or update admin user (for startup seeding)
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     * @param {string} [adminTypeName='super_admin'] - Admin type name
     * @returns {Object} Admin user
     */
    seedAdmin(email, password, adminTypeName = 'super_admin') {
        const adminType = this.getAdminType(adminTypeName);
        const adminTypeId = adminType ? adminType.id : null;

        const existing = this.findByEmail(email);
        if (existing) {
            // Update password and ensure admin type
            this.updatePassword(existing.id, password);
            if (existing.admin_type_id !== adminTypeId) {
                this.update(existing.id, { adminTypeId });
            }
            return this.findById(existing.id);
        } else {
            return this.create({
                email,
                password,
                firstName: 'Admin',
                lastName: 'User',
                adminTypeId
            });
        }
    }

    /**
     * Create multiple test users
     * @param {Array} users - Array of user data objects
     * @returns {Object} { created: number, skipped: number }
     */
    seedUsers(users) {
        let created = 0;
        let skipped = 0;

        for (const userData of users) {
            try {
                if (this.emailExists(userData.email)) {
                    skipped++;
                    continue;
                }
                this.create(userData);
                created++;
            } catch (e) {
                console.error(`[UserRepository] Failed to create user ${userData.email}:`, e.message);
                skipped++;
            }
        }

        return { created, skipped };
    }
}

module.exports = UserRepository;

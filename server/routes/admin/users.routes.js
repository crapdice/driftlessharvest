/**
 * Admin Users Routes
 * 
 * Handles user management endpoints (CRUD operations).
 * Extracted from admin.routes.js for better organization.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { userRepository } = require('../../repositories');
const { checkRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../../schemas');

// GET /api/admin/users
router.get('/admin/users', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        // Get all users with role info
        const users = db.prepare(`
            SELECT u.id, u.email, u.phone, u.created_at, u.admin_type_id,
                   t.name as role_name, t.display_name as role_display_name,
                   u.first_name, u.last_name,
                   COUNT(DISTINCT o.id) as order_count
            FROM users u
            LEFT JOIN admin_types t ON u.admin_type_id = t.id
            LEFT JOIN orders o ON u.email = o.user_email
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `).all();

        // Fetch addresses by user_id
        const addresses = db.prepare('SELECT user_id, street, city, state, zip FROM addresses').all();
        const addressMap = {};
        addresses.forEach(addr => {
            if (!addressMap[addr.user_id]) {
                addressMap[addr.user_id] = addr;
            }
        });

        const safeUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            phone: u.phone || '',
            role: u.role_name || 'customer',
            role_display: u.role_display_name || 'Customer',
            created_at: u.created_at,
            order_count: u.order_count || 0,
            address: addressMap[u.id] || {},
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            isAdmin: u.admin_type_id !== null
        }));
        res.json(safeUsers);
    } catch (e) {
        console.error('GET /admin/users Error:', e);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/admin/users
router.post('/admin/users', checkRole(['admin', 'super_admin']), validate(createUserSchema), async (req, res) => {
    try {
        const { email, password, role, city, state, zip, address, phone, firstName, lastName } = req.body;

        // Check if user exists via repository
        if (userRepository.emailExists(email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Resolve role to admin_type_id
        let adminTypeId = null;
        if (role && role !== 'user' && role !== 'customer') {
            const adminType = userRepository.getAdminType(role);
            if (adminType) {
                adminTypeId = adminType.id;
            }
        }

        // Create user via repository
        const user = userRepository.create({
            email,
            password,
            firstName,
            lastName,
            phone: phone || '',
            adminTypeId
        });

        // Create address if provided
        if (address || city || state || zip) {
            const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';
            db.prepare(`
                INSERT INTO addresses (user_id, name, street, city, state, zip, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `).run(user.id, fullName, address || '', city || '', state || '', zip || '');
        }

        res.json({ success: true, id: user.id });
    } catch (err) {
        console.error('POST /admin/users Error:', err);
        res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
});

// PUT /api/admin/users/:id
router.put('/admin/users/:id', checkRole(['admin', 'super_admin']), validate(updateUserSchema), (req, res) => {
    try {
        const { email, role, phone, address, city, state, zip, firstName, lastName } = req.body;
        const userId = parseInt(req.params.id, 10);

        // Resolve role to admin_type_id
        let adminTypeId = null;
        if (role && role !== 'user' && role !== 'customer') {
            const adminType = userRepository.getAdminType(role);
            if (adminType) {
                adminTypeId = adminType.id;
            }
        }

        // Update user via repository
        userRepository.update(userId, {
            email,
            firstName,
            lastName,
            phone: phone || '',
            adminTypeId
        });

        // Handle address update/creation if address fields are provided
        if (address || city || state || zip) {
            const user = userRepository.findById(userId);
            const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';

            const existingAddress = db.prepare('SELECT id FROM addresses WHERE user_id = ?').get(userId);

            if (existingAddress) {
                db.prepare(`
                    UPDATE addresses 
                    SET name = ?, street = ?, city = ?, state = ?, zip = ?
                    WHERE user_id = ?
                `).run(fullName, address || '', city || '', state || '', zip || '', userId);
            } else {
                db.prepare(`
                    INSERT INTO addresses (user_id, name, street, city, state, zip, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                `).run(userId, fullName, address || '', city || '', state || '', zip || '');
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('PUT /admin/users/:id Error:', err);
        res.status(500).json({ error: 'Failed to update user', details: err.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', checkRole(['super_admin']), (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);

        // Can't delete yourself
        if (req.user.id === userId) {
            return res.status(400).json({ error: "Cannot delete yourself" });
        }

        // Check user exists
        const user = userRepository.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user and related data atomically
        const result = userRepository.deleteWithRelated(userId);
        res.json({ success: true, deleted: result.deleted });
    } catch (err) {
        console.error('DELETE /admin/users/:id Error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


// POST /api/admin/users/:id/reset
router.post('/admin/users/:id/reset', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        console.log(`[Mock] Password reset email sent to user ${req.params.id}`);
        res.json({ success: true, message: 'Password reset link sent (Mock)' });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;

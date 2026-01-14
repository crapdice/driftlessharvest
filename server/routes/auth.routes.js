const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema, updateProfileSchema } = require('../schemas');

// POST /api/auth/signup
router.post('/auth/signup', validate(signupSchema), async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        // Zod handles existence checks for email/password/names
        const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (exists) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // id is AUTOINCREMENT INTEGER now
        const result = db.prepare('INSERT INTO users (email, password, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)')
            .run(email, hashedPassword, firstName, lastName, phone || '');

        const id = result.lastInsertRowid;

        const token = jwt.sign({ id, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id, email, role: 'user', firstName, lastName, phone } });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// POST /api/auth/login
router.post('/auth/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        // Debug Log (Remove in production or use proper logger)
        // console.log(`[Login Attempt] Email: ${email}, Found: ${!!user}`);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Resolve Role
        let role = user.role || 'user'; // Default to DB role
        if (user.is_admin) {
            const type = db.prepare('SELECT name FROM admin_types WHERE id = ?').get(user.admin_type_id);
            if (type && type.name === 'superadmin') role = 'super_admin';
            else if (type) role = type.name;
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone || '',
                address: JSON.parse(user.address || '{}'),
                role: role
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
});

// ALIAS: Support legacy /api/login path for Admin Panel (Using same schema)
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Resolve Role
        let role = user.role || 'user';
        if (user.is_admin) {
            const type = db.prepare('SELECT name FROM admin_types WHERE id = ?').get(user.admin_type_id);
            if (type && type.name === 'superadmin') role = 'super_admin';
            else if (type) role = type.name;
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone || '',
                address: JSON.parse(user.address || '{}'),
                role: role
            }
        });
    } catch (err) {
        console.error('Legacy Login Error:', err);
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
});

// USER: Get Own Profile
router.get('/user/profile', authenticateToken, (req, res) => {
    try {
        // Fetch user basic info
        // Schema probe shows: id, email, password, first_name, last_name, is_admin, created_at
        // MISSING: role, phone, default_address_id
        const user = db.prepare(`
            SELECT id, email, first_name, last_name, is_admin
            FROM users 
            WHERE id = ?
        `).get(req.user.id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Polyfill role
        user.role = user.is_admin ? 'admin' : 'user';

        // Fetch Addresses (Billing & Shipping)
        const addresses = db.prepare('SELECT type, street, city, state, zip, phone, is_default FROM addresses WHERE user_id = ?').all(user.id);

        const billing = addresses.find(a => a.type === 'billing') || {};
        const shipping = addresses.find(a => a.type === 'shipping') || {};

        // If only one legacy address exists (no type), treat it as billing
        const legacy = addresses.find(a => !a.type) || {};
        const safeBilling = billing.street ? billing : legacy;

        user.billingAddress = {
            street: safeBilling.street || '',
            city: safeBilling.city || '',
            state: safeBilling.state || '',
            zip: safeBilling.zip || '',
            phone: safeBilling.phone || ''
        };

        user.shippingAddress = {
            street: shipping.street || '',
            city: shipping.city || '',
            state: shipping.state || '',
            zip: shipping.zip || '',
            phone: shipping.phone || ''
        };

        // For backward compatibility with existing frontend parts that expect .address
        user.address = user.billingAddress;
        // Also use billing phone as main phone check
        user.phone = user.billingAddress.phone || '';

        user.firstName = user.first_name;
        user.lastName = user.last_name;
        delete user.first_name;
        delete user.last_name;
        delete user.is_admin;

        res.json(user);
    } catch (e) {
        console.error("Profile Fetch Error:", e);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// USER: Update Own Profile
// Note: We use updateProfileSchema which allows optional fields
router.put('/user/profile', authenticateToken, validate(updateProfileSchema), (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, billingAddress, shippingAddress } = req.body;
        const id = req.user.id; // From token

        // DEBUG LOGGING
        console.log('[Profile Update Payload]', JSON.stringify({ email, firstName, lastName, billingAddress, shippingAddress }, null, 2));

        const updateAddress = (userId, type, data, userEmail, fName, lName) => {
            if (!data || (!data.street && !data.city)) return; // Don't update if no real address data
            const existing = db.prepare('SELECT id FROM addresses WHERE user_id = ? AND type = ?').get(userId, type);
            const fullName = `${fName} ${lName}`.trim();

            console.log(`[Update Address] Type: ${type}, Existing ID: ${existing?.id}, Data:`, data);

            if (existing) {
                // Update existing address
                db.prepare('UPDATE addresses SET street = ?, city = ?, state = ?, zip = ?, phone = ?, user_email = ?, first_name = ?, last_name = ?, name = ? WHERE id = ?')
                    .run(data.street || '', data.city || '', data.state || '', data.zip || '', data.phone || '', userEmail, fName, lName, fullName, existing.id);
            } else {
                // Insert new address
                db.prepare('INSERT INTO addresses (user_id, type, name, street, city, state, zip, phone, user_email, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                    .run(userId, type, fullName,
                        data.street || '', data.city || '', data.state || '', data.zip || '', data.phone || '', userEmail, fName, lName);
            }
        };

        if (password && password.length > 0) {
            const hash = bcrypt.hashSync(password, 10);
            db.prepare('UPDATE users SET email = ?, password = ?, first_name = ?, last_name = ?, phone = ? WHERE id = ?')
                .run(email, hash, firstName, lastName, phone, id);
        } else {
            db.prepare('UPDATE users SET email = ?, first_name = ?, last_name = ?, phone = ? WHERE id = ?')
                .run(email, firstName, lastName, phone, id);
        }

        // Handle Legacy Payload (flat fields) vs New Payload (nested objects)
        // Check if we have nested objects first, otherwise fallback to flat fields
        const billingData = (billingAddress && billingAddress.street) ? billingAddress : {
            street: req.body.address || req.body.street,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            phone: req.body.phone
        };

        updateAddress(id, 'billing', billingData, email, firstName, lastName);

        if (shippingAddress && shippingAddress.street) {
            updateAddress(id, 'shipping', shippingAddress, email, firstName, lastName);
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Profile Update Root Error:', e);
        // Log more details to help debug future 500s
        if (e.message) console.error('  -> Message:', e.message);
        if (e.code) console.error('  -> Code:', e.code);

        res.status(500).json({
            error: 'Failed to update profile',
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
});

module.exports = router;

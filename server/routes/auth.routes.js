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
        const id = Date.now().toString();

        // Added 'phone' to the insert since we have it validated now
        db.prepare('INSERT INTO users (id, email, password, address, role, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(id, email, hashedPassword, '{}', 'user', firstName, lastName, phone || '');

        const token = jwt.sign({ id, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id, email, address: {}, role: 'user', firstName, lastName, phone } });
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
        let role = 'user';
        if (user.is_admin) {
            const type = db.prepare('SELECT name FROM admin_types WHERE id = ?').get(user.admin_type_id);
            // Should map 'superadmin' -> 'super_admin' to match legacy middleware check?
            // Middleware checks: ['admin', 'super_admin']. 
            // DB types: 'superadmin', 'admin'.
            // We need to ensure we send a token role that passes checkRole(['admin', 'super_admin'])
            if (type && type.name === 'superadmin') role = 'super_admin';
            else if (type) role = type.name;
        } else {
            role = user.role || 'user'; // Fallback to legacy column just in case, or default
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
        res.status(500).json({ error: 'Login failed' });
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
        let role = 'user';
        if (user.is_admin) {
            const type = db.prepare('SELECT name FROM admin_types WHERE id = ?').get(user.admin_type_id);
            if (type && type.name === 'superadmin') role = 'super_admin';
            else if (type) role = type.name;
        } else {
            role = user.role || 'user';
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
        res.status(500).json({ error: 'Login failed' });
    }
});

// USER: Get Own Profile
router.get('/user/profile', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, email, phone, address, role, first_name, last_name FROM users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Parse address json
        user.address = JSON.parse(user.address || '{}');
        user.firstName = user.first_name;
        user.lastName = user.last_name;
        delete user.first_name;
        delete user.last_name;

        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// USER: Update Own Profile
// Note: We use updateProfileSchema which allows optional fields
router.put('/user/profile', authenticateToken, validate(updateProfileSchema), (req, res) => {
    try {
        const { email, city, zip, address, phone, password, firstName, lastName } = req.body;
        const id = req.user.id; // From token

        const addrJSON = JSON.stringify({ street: address, city, zip });

        if (password && password.length > 0) {
            const hash = bcrypt.hashSync(password, 10);
            db.prepare('UPDATE users SET email = ?, address = ?, phone = ?, password = ?, first_name = ?, last_name = ? WHERE id = ?')
                .run(email, addrJSON, phone || '', hash, firstName, lastName, id);
        } else {
            db.prepare('UPDATE users SET email = ?, address = ?, phone = ?, first_name = ?, last_name = ? WHERE id = ?')
                .run(email, addrJSON, phone || '', firstName, lastName, id);
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Profile Update Error:', e);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;

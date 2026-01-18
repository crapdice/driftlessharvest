const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { userRepository } = require('../repositories');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema, updateProfileSchema } = require('../schemas');

// POST /api/auth/signup
router.post('/auth/signup', validate(signupSchema), async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        // Check if user exists
        if (userRepository.emailExists(email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user via repository
        const user = userRepository.create({
            email,
            password,
            firstName,
            lastName,
            phone: phone || ''
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'customer' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set HttpOnly cookie
        res.cookie('harvest_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                role: 'customer',
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone
            }
        });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// POST /api/auth/login
router.post('/auth/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Authenticate via repository
        const user = userRepository.authenticate(email, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Determine role from admin_type
        const role = user.role_name || 'customer';

        const token = jwt.sign(
            { id: user.id, email: user.email, role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set HttpOnly cookie
        res.cookie('harvest_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone || '',
                role
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
});

// ALIAS: Support legacy /api/login path for Admin Panel
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = userRepository.authenticate(email, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const role = user.role_name || 'customer';

        const token = jwt.sign(
            { id: user.id, email: user.email, role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set HttpOnly cookie (legacy /api/login path)
        res.cookie('harvest_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone || '',
                role
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
        const user = userRepository.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Determine role
        const role = user.role_name || 'customer';

        // Fetch Addresses (Billing & Shipping)
        const addresses = db.prepare('SELECT type, street, city, state, zip, phone, is_default FROM addresses WHERE user_id = ?').all(user.id);

        const billing = addresses.find(a => a.type === 'billing') || {};
        const shipping = addresses.find(a => a.type === 'shipping') || {};
        const legacy = addresses.find(a => !a.type) || {};
        const safeBilling = billing.street ? billing : legacy;

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: safeBilling.phone || user.phone || '',
            role,
            billingAddress: {
                street: safeBilling.street || '',
                city: safeBilling.city || '',
                state: safeBilling.state || '',
                zip: safeBilling.zip || '',
                phone: safeBilling.phone || ''
            },
            shippingAddress: {
                street: shipping.street || '',
                city: shipping.city || '',
                state: shipping.state || '',
                zip: shipping.zip || '',
                phone: shipping.phone || ''
            },
            // Backward compatibility
            address: {
                street: safeBilling.street || '',
                city: safeBilling.city || '',
                state: safeBilling.state || '',
                zip: safeBilling.zip || ''
            }
        });
    } catch (e) {
        console.error("Profile Fetch Error:", e);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// USER: Update Own Profile
router.put('/user/profile', authenticateToken, validate(updateProfileSchema), (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, billingAddress, shippingAddress } = req.body;
        const id = req.user.id;

        console.log('[Profile Update Payload]', JSON.stringify({ email, firstName, lastName, billingAddress, shippingAddress }, null, 2));

        // Update user via repository
        userRepository.update(id, {
            email,
            firstName,
            lastName,
            phone
        });

        // Update password if provided
        if (password && password.length > 0) {
            userRepository.updatePassword(id, password);
        }

        // Address update helper
        const updateAddress = (userId, type, data, userEmail, fName, lName) => {
            if (!data || (!data.street && !data.city)) return;
            const existing = db.prepare('SELECT id FROM addresses WHERE user_id = ? AND type = ?').get(userId, type);
            const fullName = `${fName} ${lName}`.trim();

            console.log(`[Update Address] Type: ${type}, Existing ID: ${existing?.id}, Data:`, data);

            if (existing) {
                db.prepare('UPDATE addresses SET street = ?, city = ?, state = ?, zip = ?, phone = ?, user_email = ?, first_name = ?, last_name = ?, name = ? WHERE id = ?')
                    .run(data.street || '', data.city || '', data.state || '', data.zip || '', data.phone || '', userEmail, fName, lName, fullName, existing.id);
            } else {
                db.prepare('INSERT INTO addresses (user_id, type, name, street, city, state, zip, phone, user_email, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                    .run(userId, type, fullName,
                        data.street || '', data.city || '', data.state || '', data.zip || '', data.phone || '', userEmail, fName, lName);
            }
        };

        // Handle addresses
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
        console.error('Profile Update Error:', e);
        res.status(500).json({
            error: 'Failed to update profile',
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
});

// POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
    res.clearCookie('harvest_token');
    res.json({ success: true });
});

module.exports = router;

/**
 * Admin Utilities Routes
 * 
 * Super-admin utilities for database management, seeding, and cleanup.
 * Handles all /admin/utilities/* endpoints.
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { userRepository } = require('../../repositories');
const fs = require('fs');
const path = require('path');
const { checkRole } = require('../../middleware/auth');

// POST /admin/utilities/seed-users
router.post('/admin/utilities/seed-users', checkRole(['super_admin']), (req, res) => {
    try {
        const testUsers = [
            { email: 'customer1@test.com', password: 'password123', firstName: 'John', lastName: 'Doe', phone: '5551234567' },
            { email: 'customer2@test.com', password: 'password123', firstName: 'Jane', lastName: 'Smith', phone: '5552345678' }
        ];
        const userResult = userRepository.seedUsers(testUsers);
        res.json({ success: true, created: userResult });
    } catch (error) {
        console.error('[Utilities] Seed users error:', error);
        res.status(500).json({ error: 'Failed to seed users', details: error.message });
    }
});

// POST /admin/utilities/seed-orders
router.post('/admin/utilities/seed-orders', checkRole(['super_admin']), (req, res) => {
    try {
        res.json({ success: true, message: 'Seed functionality triggered' });
    } catch (error) {
        console.error('[Utilities] Seed orders error:', error);
        res.status(500).json({ error: 'Failed to seed orders', details: error.message });
    }
});

// POST /admin/utilities/clean-database
router.post('/admin/utilities/clean-database', checkRole(['super_admin']), (req, res) => {
    try {
        console.log('[Utilities] Starting database cleanup...');
        const payments = db.prepare('DELETE FROM payments').run();
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const carts = db.prepare('DELETE FROM active_carts').run();
        const addresses = db.prepare('DELETE FROM addresses').run();
        const users = userRepository.deleteAllExcept('admin@driftlessharvest.com');
        res.json({
            success: true,
            deleted: {
                payments: payments.changes,
                orderItems: orderItems.changes,
                orders: orders.changes,
                carts: carts.changes,
                addresses: addresses.changes,
                users
            }
        });
    } catch (error) {
        console.error('[Utilities] Cleanup error:', error);
        res.status(500).json({ error: 'Failed to clean database', details: error.message });
    }
});

// POST /admin/utilities/clean-orders
router.post('/admin/utilities/clean-orders', checkRole(['super_admin']), (req, res) => {
    try {
        const payments = db.prepare('DELETE FROM payments').run();
        const orderItems = db.prepare('DELETE FROM order_items').run();
        const orders = db.prepare('DELETE FROM orders').run();
        const carts = db.prepare('DELETE FROM active_carts').run();
        res.json({
            success: true,
            deleted: { payments: payments.changes, orderItems: orderItems.changes, orders: orders.changes, carts: carts.changes }
        });
    } catch (error) {
        console.error('[Utilities] Clean orders error:', error);
        res.status(500).json({ error: 'Failed to clean orders', details: error.message });
    }
});

// POST /admin/utilities/clean-users
router.post('/admin/utilities/clean-users', checkRole(['super_admin']), (req, res) => {
    try {
        const result = userRepository.deleteAllCustomersWithRelated();
        res.json({ success: true, deleted: result });
    } catch (error) {
        console.error('[Utilities] Clean users error:', error);
        res.status(500).json({ error: 'Failed to clean users', details: error.message });
    }
});

// POST /admin/utilities/clean-analytics
router.post('/admin/utilities/clean-analytics', checkRole(['super_admin']), (req, res) => {
    try {
        const result = db.prepare('DELETE FROM analytics_events').run();
        res.json({ success: true, deleted: { analytics_events: result.changes } });
    } catch (error) {
        console.error('[Utilities] Clean analytics error:', error);
        res.status(500).json({ error: 'Failed to clean analytics', details: error.message });
    }
});

// POST /admin/utilities/clean-delivery-windows
router.post('/admin/utilities/clean-delivery-windows', checkRole(['super_admin']), (req, res) => {
    try {
        const result = db.prepare('DELETE FROM delivery_windows').run();
        res.json({ success: true, deleted: { delivery_windows: result.changes } });
    } catch (error) {
        console.error('[Utilities] Clean delivery windows error:', error);
        res.status(500).json({ error: 'Failed to clean delivery windows', details: error.message });
    }
});

// GET /admin/utilities/verify-database
router.get('/admin/utilities/verify-database', checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        res.json({
            success: true,
            counts: {
                users: userRepository.count(),
                orders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count
            }
        });
    } catch (error) {
        console.error('[Utilities] Verify error:', error);
        res.status(500).json({ error: 'Failed to verify database', details: error.message });
    }
});

// POST /admin/utilities/clean-temp-files
router.post('/admin/utilities/clean-temp-files', checkRole(['super_admin']), (req, res) => {
    try {
        res.json({ success: true, deleted: 0 });
    } catch (error) {
        console.error('[Utilities] Clean temp files error:', error);
        res.status(500).json({ error: 'Failed to clean temp files', details: error.message });
    }
});

// GET /admin/utilities/query/:table
router.get('/admin/utilities/query/:table', checkRole(['admin', 'super_admin']), (req, res) => {
    const { table } = req.params;
    const allowedTables = ['users', 'orders', 'products', 'delivery_windows'];
    if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });
    try {
        const results = db.prepare(`SELECT * FROM ${table} LIMIT 100`).all();
        res.json({ success: true, results, count: results.length });
    } catch (error) {
        console.error('[Utilities Query Error]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

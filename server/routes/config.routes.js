const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { checkRole } = require('../middleware/auth');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'config.json');
const DEFAULTS_FILE = path.join(__dirname, '../data/config.defaults.json');

// GET /api/config
router.get('/config', async (req, res) => {
    try {
        const configStr = await fs.readFile(DATA_FILE, 'utf8');
        const config = JSON.parse(configStr);

        // Filter out sensitive data
        const { apiKeys, ...safeConfig } = config;

        // Add public keys
        const publicConfig = {
            ...safeConfig,
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        };

        res.json(publicConfig);
    } catch (e) {
        console.error('Config Load Error', e);
        res.status(500).json({ error: 'Failed to load config' });
    }
});

// POST /api/config
router.post('/config', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'Configuration updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// POST /api/config/restore
router.post('/config/restore', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const defaults = await fs.readFile(DEFAULTS_FILE, 'utf8');
        await fs.writeFile(DATA_FILE, defaults);
        res.json({ success: true, message: 'Configuration restored to defaults' });
    } catch (err) {
        console.error('Failed to restore config:', err);
        res.status(500).json({ error: 'Failed to restore configuration' });
    }
});

module.exports = router;

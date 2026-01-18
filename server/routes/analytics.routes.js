/**
 * Public Analytics Routes
 * 
 * Admin analytics endpoints have been extracted to server/routes/admin/analytics.routes.js
 * This file contains only the public tracking endpoint.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/analytics/track - Track analytics event (public endpoint)
router.post('/analytics/track', (req, res) => {
    try {
        const { session_id, event_type, page_url, referrer, device_type, user_agent } = req.body;

        if (!session_id || !event_type) {
            return res.status(400).json({ error: 'session_id and event_type are required' });
        }

        // Get user_id from token if authenticated
        const user_id = req.user?.id || null;

        // Get IP address from request
        const ip_address = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            null;

        db.prepare(`
            INSERT INTO analytics_events (session_id, user_id, event_type, page_url, referrer, device_type, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(session_id, user_id, event_type, page_url, referrer, device_type, user_agent, ip_address);

        res.json({ success: true });

    } catch (error) {
        console.error('[Analytics] Error tracking event:', error);
        res.status(500).json({ error: 'Failed to track event' });
    }
});

module.exports = router;


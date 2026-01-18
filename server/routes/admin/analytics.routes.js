/**
 * Admin Analytics Routes
 * 
 * Extracted from analytics.routes.js
 * Handles /admin/analytics/* endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { authenticateToken, checkRole } = require('../../middleware/auth');

// GET /api/admin/analytics/overview - Get analytics overview
router.get('/admin/analytics/overview', authenticateToken, checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get total visits
        const totalVisits = db.prepare(`
            SELECT COUNT(*) as count 
            FROM analytics_events 
            WHERE event_type = 'pageview' 
            AND created_at >= ?
        `).get(startDate.toISOString())?.count || 0;

        // Get unique visitors
        const uniqueVisitors = db.prepare(`
            SELECT COUNT(DISTINCT session_id) as count 
            FROM analytics_events 
            WHERE event_type = 'pageview' 
            AND created_at >= ?
        `).get(startDate.toISOString())?.count || 0;

        // Get mobile percentage
        const mobileCount = db.prepare(`
            SELECT COUNT(*) as count 
            FROM analytics_events 
            WHERE event_type = 'pageview' 
            AND device_type = 'mobile' 
            AND created_at >= ?
        `).get(startDate.toISOString())?.count || 0;

        const mobilePercentage = totalVisits > 0 ? ((mobileCount / totalVisits) * 100).toFixed(1) : 0;

        // Get conversion rate (orders / unique visitors)
        const ordersCount = db.prepare(`
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE created_at >= ?
        `).get(startDate.toISOString())?.count || 0;

        const conversionRate = uniqueVisitors > 0 ? ((ordersCount / uniqueVisitors) * 100).toFixed(1) : 0;

        // Get traffic sources
        const trafficSources = db.prepare(`
            SELECT 
                CASE 
                    WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                    WHEN referrer LIKE '%google%' THEN 'Google'
                    WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                    WHEN referrer LIKE '%instagram%' THEN 'Instagram'
                    ELSE 'Other'
                END as name,
                COUNT(*) as count
            FROM analytics_events
            WHERE event_type = 'pageview' 
            AND created_at >= ?
            GROUP BY name
            ORDER BY count DESC
        `).all(startDate.toISOString());

        // Get device breakdown
        const devices = db.prepare(`
            SELECT 
                COALESCE(device_type, 'desktop') as type,
                COUNT(*) as count
            FROM analytics_events
            WHERE event_type = 'pageview' 
            AND created_at >= ?
            GROUP BY device_type
        `).all(startDate.toISOString());

        // Get new vs returning visitors
        const newVisitors = db.prepare(`
            SELECT COUNT(DISTINCT session_id) as count
            FROM analytics_events
            WHERE event_type = 'pageview'
            AND created_at >= ?
            AND session_id NOT IN (
                SELECT DISTINCT session_id 
                FROM analytics_events 
                WHERE created_at < ?
            )
        `).get(startDate.toISOString(), startDate.toISOString())?.count || 0;

        const returningVisitors = uniqueVisitors - newVisitors;

        // Get conversion funnel data
        const productViews = db.prepare(`
            SELECT COUNT(*) as count 
            FROM analytics_events 
            WHERE event_type = 'product_view' 
            AND created_at >= ?
        `).get(startDate.toISOString())?.count || 0;

        const addToCart = db.prepare(`
            SELECT COUNT(*) as count 
            FROM analytics_events 
            WHERE event_type = 'add_to_cart' 
            AND created_at >= ?
        `).get(startDate.toISOString())?.count || 0;

        const checkout = db.prepare(`
            SELECT COUNT(*) as count 
            FROM analytics_events 
            WHERE event_type = 'checkout' 
            AND created_at >= ?
        `).get(startDate.toISOString())?.count || 0;

        res.json({
            overview: {
                totalVisits,
                uniqueVisitors,
                conversionRate: parseFloat(conversionRate),
                mobilePercentage: parseFloat(mobilePercentage)
            },
            trafficSources,
            devices,
            visitorTypes: {
                new: newVisitors,
                returning: returningVisitors
            },
            conversionFunnel: {
                visits: totalVisits,
                productViews,
                addToCart,
                checkout,
                purchase: ordersCount
            }
        });

    } catch (error) {
        console.error('[Analytics] Error fetching overview:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

// GET /api/admin/analytics/recent-visitors - Get last 10 visitors
router.get('/admin/analytics/recent-visitors', authenticateToken, checkRole(['admin', 'super_admin']), (req, res) => {
    try {
        const recentVisitors = db.prepare(`
            SELECT 
                ip_address,
                user_agent,
                page_url,
                created_at,
                session_id
            FROM analytics_events
            WHERE event_type = 'pageview'
            ORDER BY created_at DESC
            LIMIT 10
        `).all();

        res.json({ visitors: recentVisitors });

    } catch (error) {
        console.error('[Analytics] Error fetching recent visitors:', error);
        res.status(500).json({ error: 'Failed to fetch recent visitors' });
    }
});

module.exports = router;

/**
 * Admin Routes Aggregator
 * 
 * Combines all admin route modules into a single router.
 * This allows gradual extraction from admin.routes.js without
 * changing how routes are mounted in app.js.
 */

const express = require('express');
const router = express.Router();

// Import sub-routers
const statsRoutes = require('./stats.routes');
const inventoryRoutes = require('./inventory.routes');
const usersRoutes = require('./users.routes');
const ordersRoutes = require('./orders.routes');
const deliveryRoutes = require('./delivery.routes');
const categoriesRoutes = require('./categories.routes');
const productsRoutes = require('./products.routes');
const boxTemplatesRoutes = require('./box-templates.routes');
const utilitiesRoutes = require('./utilities.routes');
const analyticsRoutes = require('./analytics.routes');

// Mount sub-routers (routes maintain their full paths like /admin/stats)
router.use(statsRoutes);
router.use(inventoryRoutes);
router.use(usersRoutes);
router.use(ordersRoutes);
router.use(deliveryRoutes);
router.use(categoriesRoutes);
router.use(productsRoutes);
router.use(boxTemplatesRoutes);
router.use(utilitiesRoutes);
router.use(analyticsRoutes);

module.exports = router;





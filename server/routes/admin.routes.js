/**
 * Legacy Admin Routes (DEPRECATED)
 * 
 * All admin routes have been extracted to server/routes/admin/
 * This file is kept only for the debug endpoint and backwards compatibility.
 * 
 * See server/routes/admin/index.js for the route aggregator.
 */

const express = require('express');
const router = express.Router();

// Debug endpoint
router.get('/admin/test', (req, res) => res.json({ status: 'ok', msg: 'Admin path works' }));

module.exports = router;



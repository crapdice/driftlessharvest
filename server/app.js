const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const configRoutes = require('./routes/config.routes');
const generalRoutes = require('./routes/general.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(cors());

// Configure Body Parser to preserve raw body for Stripe Webhooks
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/api/webhook')) {
            req.rawBody = buf.toString();
        }
    }
}));

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve Admin Panel (Priority)
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Serve static files from root (Customer App)
// Note: We serve the parent directory to access index.html, js/, css/ etc.
app.use(express.static(path.join(__dirname, '../')));

// Debug Endpoint
app.get('/api/admin/test', (req, res) => res.json({ status: 'ok', msg: 'Admin path works' }));

// Mount Routes
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', configRoutes);
app.use('/api', generalRoutes);
app.use('/api', paymentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER:", err);
    require('fs').writeFileSync('global_error.log', String(err) + '\n' + (err.stack || 'No stack'));
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// SPA Fallback (Must be last get route)
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

module.exports = app;

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
app.use('/marketing', express.static(path.join(__dirname, '../public/marketing')));

// A/B Test Routing for Homepage
app.get('/', (req, res, next) => {
    const fs = require('fs');
    const configPath = path.join(__dirname, 'data/config.json');

    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const launchModeEnabled = config.meta?.launchModeEnabled;
            const activeVariant = config.meta?.activeLaunchVariant;

            if (launchModeEnabled && activeVariant) {
                console.log(`[A/B Router] Serving Launch Variant: ${activeVariant}`);
                // Map variant name to filename: "Artisan Sketch (Design 3)" -> "design_3.html"
                const match = activeVariant.match(/Design (\d)/);
                if (match) {
                    const designFile = `design_${match[1]}.html`;
                    const designPath = path.join(__dirname, `../public/previews/launching/${designFile}`);
                    if (fs.existsSync(designPath)) {
                        return res.sendFile(designPath);
                    }
                }
            }
        } catch (e) {
            console.error('[A/B Router Error]', e);
        }
    }
    next(); // Fallback to normal static serving
});

// Serve static files from public/ (Customer App)
app.use(express.static(path.join(__dirname, '../public')));

// Explicit static routes for assets (fallback for debugging)
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Debug Endpoint
app.get('/api/admin/test', (req, res) => res.json({ status: 'ok', msg: 'Admin path works' }));

// Mount Routes
app.use('/api', authRoutes);
app.use('/api', require('./routes/admin')); // New modular admin routes (extracted)
app.use('/api', adminRoutes); // Legacy admin routes (being phased out)
app.use('/api/admin/marketing', require('./routes/admin-marketing.routes'));
app.use('/api', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', configRoutes);
app.use('/api', generalRoutes);
app.use('/api', paymentRoutes);
// utilities.routes moved to ./routes/admin/utilities.routes.js (mounted via admin aggregator)
app.use('/api', require('./routes/analytics.routes'));
app.use('/api', require('./routes/gemini.routes'));


// 404 Handler for API
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API Endpoint Not Found' });
});


// Global Error Handler
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER:", err);
    require('fs').writeFileSync('global_error.log', String(err) + '\n' + (err.stack || 'No stack'));
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// SPA Fallback (Must be last get route)
// Exclude API routes and static asset file extensions
app.get(/^(?!\/api)(?!.*\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp|mp4|webm|json)$).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;

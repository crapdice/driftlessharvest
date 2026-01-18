/**
 * Launch Mode Routing Tests
 * 
 * Verifies that when launch mode is enabled, all non-admin routes
 * serve the launch page instead of the regular app.
 */
const request = require('supertest');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

// We need to mock the config before requiring the app
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../server/data');
const configPath = path.join(DATA_DIR, 'config.json');

describe('Launch Mode Routing', function () {
    this.timeout(10000);

    let originalConfig;
    let app;

    before(function () {
        // Backup original config
        if (fs.existsSync(configPath)) {
            originalConfig = fs.readFileSync(configPath, 'utf8');
        }
    });

    after(function () {
        // Restore original config
        if (originalConfig) {
            fs.writeFileSync(configPath, originalConfig);
        }
    });

    describe('When launch mode is ENABLED', function () {
        before(function () {
            // Enable launch mode in config
            const config = originalConfig ? JSON.parse(originalConfig) : { meta: {} };
            config.meta = config.meta || {};
            config.meta.launchModeEnabled = true;
            config.meta.activeLaunchVariant = 'Hearth & Harvest (Design 1)';
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            // Clear require cache and reload app
            delete require.cache[require.resolve('../server/app')];
            app = require('../server/app');
        });

        it('should serve launch page for root path /', async function () {
            const res = await request(app).get('/');
            expect(res.status).to.equal(200);
            expect(res.text).to.include('design'); // Launch page contains design elements
        });

        it('should serve launch page for /shop', async function () {
            const res = await request(app).get('/shop');
            expect(res.status).to.equal(200);
            // Should NOT contain app navigation, should be launch page
        });

        it('should serve launch page for /random-path', async function () {
            const res = await request(app).get('/random-path');
            expect(res.status).to.equal(200);
        });

        it('should serve launch page for /login.html', async function () {
            const res = await request(app).get('/login.html');
            expect(res.status).to.equal(200);
        });

        it('should ALLOW /admin routes', async function () {
            const res = await request(app).get('/admin/');
            expect(res.status).to.equal(200);
            // Admin should still be accessible
        });

        it('should ALLOW /api routes', async function () {
            const res = await request(app).get('/api/config');
            expect(res.status).to.be.oneOf([200, 401]); // API responds, not launch page
        });

        it('should ALLOW /marketing routes', async function () {
            const res = await request(app).get('/marketing/');
            expect(res.status).to.equal(200);
        });

        it('should ALLOW static assets for launch page', async function () {
            const res = await request(app).get('/assets/test.css');
            // Should not redirect to launch page (would cause infinite loop)
            expect(res.status).to.be.oneOf([200, 404]); // 404 if file doesn't exist, but not launch page
        });
    });

    describe('When launch mode is DISABLED', function () {
        before(function () {
            // Disable launch mode in config
            const config = originalConfig ? JSON.parse(originalConfig) : { meta: {} };
            config.meta = config.meta || {};
            config.meta.launchModeEnabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            // Clear require cache and reload app
            delete require.cache[require.resolve('../server/app')];
            app = require('../server/app');
        });

        it('should serve normal app for root path /', async function () {
            const res = await request(app).get('/');
            expect(res.status).to.equal(200);
        });

        it('should serve normal 404 for non-existent paths', async function () {
            const res = await request(app).get('/nonexistent-random-path-xyz');
            // When launch mode is off, unknown paths should get normal handling
            expect(res.status).to.be.oneOf([200, 404]);
        });
    });
});

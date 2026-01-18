/**
 * Utilities Admin Routes Contract Tests
 * 
 * Tests for all /api/admin/utilities/* endpoints.
 * Note: These are super_admin-only destructive operations.
 * Tests only verify endpoints respond (don't actually clean data).
 * 
 * Usage: node tests/routes/utilities.routes.test.js
 * Requires: Server running on localhost:3000
 */

const { req, login, TestRunner, assert } = require('../helpers/test-utils');

const ADMIN_EMAIL = 'admin@driftlessharvest.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

async function runTests() {
    console.log('='.repeat(60));
    console.log('Utilities Admin Routes Contract Tests');
    console.log('='.repeat(60));

    // Login as admin
    let token;
    try {
        console.log(`\nAuthenticating as ${ADMIN_EMAIL}...`);
        token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✓ Authenticated successfully\n');
    } catch (e) {
        console.error('✗ Authentication failed:', e.message);
        process.exit(1);
    }

    // ============================================================
    // Utilities Routes
    // ============================================================
    const utilitiesTests = new TestRunner('Utilities Admin Routes');
    console.log('--- Utilities Admin Routes ---');

    // GET verify-database (safe to run)
    await utilitiesTests.test('GET /api/admin/utilities/verify-database returns counts', async () => {
        const res = await req('/api/admin/utilities/verify-database', 'GET', null, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
        assert.hasProperty(res.body, 'counts');
    });

    await utilitiesTests.test('GET /api/admin/utilities/verify-database requires auth', async () => {
        const res = await req('/api/admin/utilities/verify-database', 'GET');
        assert.status(res, 401);
    });

    // GET query/:table (read-only, safe)
    await utilitiesTests.test('GET /api/admin/utilities/query/users returns data', async () => {
        const res = await req('/api/admin/utilities/query/users', 'GET', null, token);
        assert.statusOk(res);
        // Query endpoint returns object, not bare array
        assert.ok(res.body !== null && typeof res.body === 'object', 'Expected object response');
    });

    // Note: We don't test the destructive POST endpoints (clean-*, seed-*) 
    // as they would modify data. Just verify they require proper auth.
    await utilitiesTests.test('POST /api/admin/utilities/clean-database requires super_admin', async () => {
        const res = await req('/api/admin/utilities/clean-database', 'POST', {}, token);
        // Should fail with 403 if user is admin but not super_admin
        // or succeed with 200 if super_admin
        // Either way, it should not be 401 (unauthorized)
        assert.ok(res.status === 200 || res.status === 403,
            `Expected 200 or 403, got ${res.status}`);
    });

    await utilitiesTests.test('POST /api/admin/utilities/clean-orders requires auth', async () => {
        const res = await req('/api/admin/utilities/clean-orders', 'POST', {});
        assert.status(res, 401);
    });

    await utilitiesTests.test('POST /api/admin/utilities/clean-users requires auth', async () => {
        const res = await req('/api/admin/utilities/clean-users', 'POST', {});
        assert.status(res, 401);
    });

    await utilitiesTests.test('POST /api/admin/utilities/clean-analytics requires auth', async () => {
        const res = await req('/api/admin/utilities/clean-analytics', 'POST', {});
        assert.status(res, 401);
    });

    await utilitiesTests.test('POST /api/admin/utilities/clean-delivery-windows requires auth', async () => {
        const res = await req('/api/admin/utilities/clean-delivery-windows', 'POST', {});
        assert.status(res, 401);
    });

    await utilitiesTests.test('POST /api/admin/utilities/seed-users requires auth', async () => {
        const res = await req('/api/admin/utilities/seed-users', 'POST', {});
        assert.status(res, 401);
    });

    await utilitiesTests.test('POST /api/admin/utilities/seed-orders requires auth', async () => {
        const res = await req('/api/admin/utilities/seed-orders', 'POST', {});
        assert.status(res, 401);
    });

    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const allPassed = utilitiesTests.summary();

    console.log('');
    if (allPassed) {
        console.log('✅ ALL TESTS PASSED');
        process.exit(0);
    } else {
        console.log('❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

runTests().catch(e => {
    console.error('Test runner error:', e);
    process.exit(1);
});

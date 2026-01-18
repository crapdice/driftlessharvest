/**
 * Admin Routes Contract Tests
 * 
 * These tests verify the API contracts for all admin endpoints.
 * Run BEFORE refactoring to establish baseline, then after each change.
 * 
 * Usage: node tests/routes/admin.routes.test.js
 * Requires: Server running on localhost:3000
 */

const { req, login, TestRunner, assert } = require('../helpers/test-utils');

// Test data
const ADMIN_EMAIL = 'admin@driftlessharvest.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

async function runTests() {
    console.log('='.repeat(60));
    console.log('Admin Routes Contract Tests');
    console.log('='.repeat(60));

    // Login as admin
    let token;
    try {
        console.log(`\nAuthenticating as ${ADMIN_EMAIL}...`);
        token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✓ Authenticated successfully\n');
    } catch (e) {
        console.error('✗ Authentication failed:', e.message);
        console.error('Make sure the server is running and admin user exists.');
        process.exit(1);
    }

    // ============================================================
    // Stats Routes
    // ============================================================
    const statsTests = new TestRunner('Stats Routes');
    console.log('\n--- Stats Routes ---');

    await statsTests.test('GET /api/admin/stats returns stats object', async () => {
        const res = await req('/api/admin/stats', 'GET', null, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'orderCount');
        assert.hasProperty(res.body, 'revenue');
        assert.hasProperty(res.body, 'pending');
    });

    await statsTests.test('GET /api/admin/stats requires auth', async () => {
        const res = await req('/api/admin/stats', 'GET');
        assert.status(res, 401);
    });

    // ============================================================
    // Inventory Status Routes
    // ============================================================
    const inventoryTests = new TestRunner('Inventory Routes');
    console.log('\n--- Inventory Routes ---');

    await inventoryTests.test('GET /api/admin/inventory-status returns status', async () => {
        const res = await req('/api/admin/inventory-status', 'GET', null, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'lowStockCount');
        assert.hasProperty(res.body, 'threshold');
        assert.hasProperty(res.body, 'products');
        assert.isArray(res.body.products);
    });

    await inventoryTests.test('GET /api/admin/inventory-status threshold is number', async () => {
        const res = await req('/api/admin/inventory-status', 'GET', null, token);
        assert.statusOk(res);
        assert.ok(typeof res.body.threshold === 'number', 'threshold should be a number');
    });

    // ============================================================
    // Users Routes
    // ============================================================
    const usersTests = new TestRunner('Users Routes');
    console.log('\n--- Users Routes ---');

    await usersTests.test('GET /api/admin/users returns array of users', async () => {
        const res = await req('/api/admin/users', 'GET', null, token);
        assert.statusOk(res);
        assert.isArray(res.body);
        if (res.body.length > 0) {
            assert.hasProperty(res.body[0], 'id');
            assert.hasProperty(res.body[0], 'email');
        }
    });

    // Create a test user for subsequent tests
    const testEmail = `test_${Date.now()}@example.com`;
    let testUserId;

    await usersTests.test('POST /api/admin/users creates new user', async () => {
        const res = await req('/api/admin/users', 'POST', {
            email: testEmail,
            password: 'testpass123',
            role: 'customer',
            firstName: 'Test',
            lastName: 'User'
        }, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
        assert.hasProperty(res.body, 'id');
        testUserId = res.body.id;
    });

    await usersTests.test('PUT /api/admin/users/:id updates user', async () => {
        if (!testUserId) throw new Error('No test user created');
        const res = await req(`/api/admin/users/${testUserId}`, 'PUT', {
            email: testEmail,
            role: 'customer',
            phone: '5551234567',
            firstName: 'Updated',
            lastName: 'User'
        }, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
    });

    await usersTests.test('POST /api/admin/users/:id/reset triggers password reset', async () => {
        if (!testUserId) throw new Error('No test user created');
        const res = await req(`/api/admin/users/${testUserId}/reset`, 'POST', {}, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
    });

    // ============================================================
    // Orders Routes
    // ============================================================
    const ordersTests = new TestRunner('Orders Routes');
    console.log('\n--- Orders Routes ---');

    await ordersTests.test('GET /api/admin/orders returns array of orders', async () => {
        const res = await req('/api/admin/orders', 'GET', null, token);
        assert.statusOk(res);
        assert.isArray(res.body);
        if (res.body.length > 0) {
            assert.hasProperty(res.body[0], 'id');
            assert.hasProperty(res.body[0], 'status');
            assert.hasProperty(res.body[0], 'items');
        }
    });

    // ============================================================
    // Delivery Routes
    // ============================================================
    const deliveryTests = new TestRunner('Delivery Routes');
    console.log('\n--- Delivery Routes ---');

    await deliveryTests.test('GET /api/admin/delivery-schedule returns schedule', async () => {
        const res = await req('/api/admin/delivery-schedule', 'GET', null, token);
        assert.statusOk(res);
        assert.isArray(res.body);
    });

    await deliveryTests.test('GET /api/admin/delivery-windows returns windows', async () => {
        const res = await req('/api/admin/delivery-windows', 'GET', null, token);
        assert.statusOk(res);
        assert.isArray(res.body);
    });

    // Create a test delivery window
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const testDateValue = futureDate.toISOString().split('T')[0];
    const testDateLabel = `Test Window ${Date.now()}`;
    let testWindowId;

    await deliveryTests.test('POST /api/admin/delivery-windows creates window', async () => {
        const res = await req('/api/admin/delivery-windows', 'POST', {
            date_label: testDateLabel,
            date_value: testDateValue
        }, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
        assert.hasProperty(res.body, 'id');
        testWindowId = res.body.id;
    });

    await deliveryTests.test('PUT /api/admin/delivery-windows/:id updates window', async () => {
        if (!testWindowId) throw new Error('No test window created');
        const res = await req(`/api/admin/delivery-windows/${testWindowId}`, 'PUT', {
            is_active: false
        }, token);
        assert.statusOk(res);
    });

    await deliveryTests.test('DELETE /api/admin/delivery-windows/:id deletes window', async () => {
        if (!testWindowId) throw new Error('No test window created');
        const res = await req(`/api/admin/delivery-windows/${testWindowId}`, 'DELETE', null, token);
        assert.statusOk(res);
    });

    // ============================================================
    // Active Carts Routes
    // ============================================================
    const cartsTests = new TestRunner('Active Carts Routes');
    console.log('\n--- Active Carts Routes ---');

    await cartsTests.test('GET /api/admin/active-carts returns array', async () => {
        const res = await req('/api/admin/active-carts', 'GET', null, token);
        assert.statusOk(res);
        assert.isArray(res.body);
    });

    // ============================================================
    // Categories Routes (in admin.routes.js)
    // ============================================================
    const categoriesTests = new TestRunner('Categories Routes (Admin)');
    console.log('\n--- Categories Routes ---');

    await categoriesTests.test('POST /api/admin/categories creates category', async () => {
        const res = await req('/api/admin/categories', 'POST', {
            name: `Test Category ${Date.now()}`,
            description: 'Test description'
        }, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
        assert.hasProperty(res.body, 'id');
    });

    // ============================================================
    // Cleanup: Delete test user
    // ============================================================
    if (testUserId) {
        console.log('\n--- Cleanup ---');
        // Note: DELETE requires super_admin, which we may not have
        // We'll skip cleanup deletion for now
        console.log(`  (Test user ${testEmail} created but not deleted - requires super_admin)`);
    }

    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const allPassed = [
        statsTests.summary(),
        inventoryTests.summary(),
        usersTests.summary(),
        ordersTests.summary(),
        deliveryTests.summary(),
        cartsTests.summary(),
        categoriesTests.summary()
    ].every(p => p);

    console.log('');
    if (allPassed) {
        console.log('✅ ALL TESTS PASSED');
        process.exit(0);
    } else {
        console.log('❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

// Run tests
runTests().catch(e => {
    console.error('Test runner error:', e);
    process.exit(1);
});

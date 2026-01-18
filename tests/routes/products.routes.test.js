/**
 * Product Admin Routes Contract Tests
 * 
 * Tests for all /api/admin/products/* endpoints.
 * Run BEFORE refactoring to establish baseline, then after each change.
 * 
 * Usage: node tests/routes/products.routes.test.js
 * Requires: Server running on localhost:3000
 */

const { req, login, TestRunner, assert } = require('../helpers/test-utils');

const ADMIN_EMAIL = 'admin@driftlessharvest.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

async function runTests() {
    console.log('='.repeat(60));
    console.log('Product Admin Routes Contract Tests');
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
    // Product CRUD Routes
    // ============================================================
    const productsTests = new TestRunner('Product Admin Routes');
    console.log('--- Product Admin Routes ---');

    // GET all products
    await productsTests.test('GET /api/admin/products returns array', async () => {
        const res = await req('/api/admin/products', 'GET', null, token);
        assert.statusOk(res);
        assert.isArray(res.body);
        if (res.body.length > 0) {
            assert.hasProperty(res.body[0], 'id');
            assert.hasProperty(res.body[0], 'name');
            assert.hasProperty(res.body[0], 'price');
        }
    });

    await productsTests.test('GET /api/admin/products requires auth', async () => {
        const res = await req('/api/admin/products', 'GET');
        assert.status(res, 401);
    });

    // Create a test product for subsequent tests
    const testProductName = `Test Product ${Date.now()}`;
    let testProductId;

    await productsTests.test('POST /api/admin/products creates product', async () => {
        const res = await req('/api/admin/products', 'POST', {
            name: testProductName,
            category: 'Test',
            price: 9.99,
            stock: 10,
            is_active: true,
            tags: ['test']
        }, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
        assert.hasProperty(res.body, 'id');
        testProductId = res.body.id;
    });

    // GET single product
    await productsTests.test('GET /api/admin/products/:id returns product', async () => {
        if (!testProductId) throw new Error('No test product created');
        const res = await req(`/api/admin/products/${testProductId}`, 'GET', null, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'id');
        assert.hasProperty(res.body, 'name');
        assert.equal(res.body.name, testProductName, 'Name mismatch');
    });

    // PUT update product
    await productsTests.test('PUT /api/admin/products/:id updates product', async () => {
        if (!testProductId) throw new Error('No test product created');
        const res = await req(`/api/admin/products/${testProductId}`, 'PUT', {
            name: testProductName + ' Updated',
            price: 12.99,
            stock: 5
        }, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
    });

    // DELETE (soft delete/archive)
    await productsTests.test('DELETE /api/admin/products/:id archives product', async () => {
        if (!testProductId) throw new Error('No test product created');
        const res = await req(`/api/admin/products/${testProductId}`, 'DELETE', null, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
    });

    // GET archived products
    await productsTests.test('GET /api/admin/products/archived returns array', async () => {
        const res = await req('/api/admin/products/archived', 'GET', null, token);
        assert.statusOk(res);
        assert.isArray(res.body);
    });

    // POST restore product
    await productsTests.test('POST /api/admin/products/:id/restore restores product', async () => {
        if (!testProductId) throw new Error('No test product created');
        const res = await req(`/api/admin/products/${testProductId}/restore`, 'POST', {}, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
    });

    // DELETE permanent
    await productsTests.test('DELETE /api/admin/products/:id/permanent deletes product', async () => {
        if (!testProductId) throw new Error('No test product created');
        const res = await req(`/api/admin/products/${testProductId}/permanent`, 'DELETE', null, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
    });

    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const allPassed = productsTests.summary();

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

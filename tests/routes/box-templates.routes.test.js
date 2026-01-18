/**
 * Box-Templates Admin Routes Contract Tests
 * 
 * Tests for all /api/admin/box-templates/* endpoints.
 * Run BEFORE refactoring to establish baseline, then after each change.
 * 
 * Usage: node tests/routes/box-templates.routes.test.js
 * Requires: Server running on localhost:3000
 */

const { req, login, TestRunner, assert } = require('../helpers/test-utils');

const ADMIN_EMAIL = 'admin@driftlessharvest.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

async function runTests() {
    console.log('='.repeat(60));
    console.log('Box-Templates Admin Routes Contract Tests');
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
    // Box-Templates CRUD Routes
    // ============================================================
    const templatesTests = new TestRunner('Box-Templates Admin Routes');
    console.log('--- Box-Templates Admin Routes ---');

    // GET all box-templates (admin)
    await templatesTests.test('GET /api/admin/box-templates returns array', async () => {
        const res = await req('/api/admin/box-templates', 'GET', null, token);
        assert.statusOk(res);
        assert.isArray(res.body);
    });

    await templatesTests.test('GET /api/admin/box-templates requires auth', async () => {
        const res = await req('/api/admin/box-templates', 'GET');
        assert.status(res, 401);
    });

    // Create a test template
    const testTemplateName = `Test Template ${Date.now()}`;
    let testTemplateId;

    await templatesTests.test('POST /api/admin/box-templates creates template', async () => {
        const res = await req('/api/admin/box-templates', 'POST', {
            name: testTemplateName,
            description: 'Test description',
            price: 29.99,
            is_active: true,
            items: []
        }, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
        assert.hasProperty(res.body, 'id');
        testTemplateId = res.body.id;
    });

    // PUT update template
    await templatesTests.test('PUT /api/admin/box-templates/:id updates template', async () => {
        if (!testTemplateId) throw new Error('No test template created');
        const res = await req(`/api/admin/box-templates/${testTemplateId}`, 'PUT', {
            name: testTemplateName + ' Updated',
            description: 'Updated description',
            price: 39.99,
            is_active: false,
            items: []
        }, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
    });

    // DELETE template
    await templatesTests.test('DELETE /api/admin/box-templates/:id deletes template', async () => {
        if (!testTemplateId) throw new Error('No test template created');
        const res = await req(`/api/admin/box-templates/${testTemplateId}`, 'DELETE', null, token);
        assert.statusOk(res);
        assert.hasProperty(res.body, 'success');
    });

    // GET public box-templates (no auth required)
    await templatesTests.test('GET /api/box-templates (public) returns array', async () => {
        const res = await req('/api/box-templates', 'GET');
        assert.statusOk(res);
        assert.isArray(res.body);
    });

    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const allPassed = templatesTests.summary();

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

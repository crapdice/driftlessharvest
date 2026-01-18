/**
 * Verification Script: Admin API Keys Modularization (TDD)
 * This script verifies that the API Keys view can be loaded modularly
 * and that the necessary API endpoints are responsive.
 */

const http = require('http');

function req(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: headers
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, body: data }); }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function verify() {
    console.log('--- Verifying Admin API Keys Modularization (TDD) ---');

    // 1. Check if the API Keys view file exists and is accessible via HTTP
    const viewRes = await req('/admin/views/api-keys.html', 'GET');
    if (viewRes.status === 200 && viewRes.body.includes('Resend API Key')) {
        console.log('[PASS] API Keys view file is accessible.');
    } else {
        console.error(`[FAIL] API Keys view file check failed (${viewRes.status}).`);
        process.exit(1);
    }

    // 2. Check if the API Keys module file exists and is accessible
    const moduleRes = await req('/admin/js/modules/api-keys.js', 'GET');
    if (moduleRes.status === 200 && moduleRes.body.includes('initApiKeys')) {
        console.log('[PASS] API Keys module file is accessible.');
    } else {
        console.error(`[FAIL] API Keys module file check failed (${moduleRes.status}).`);
        process.exit(1);
    }

    // 3. Verify that the Config API (used by API Keys module) is responsive
    // Note: detailed auth checking is covered by other e2e tests, here we just check endpoint existence.
    const configRes = await req('/api/config', 'GET');
    if (configRes.status === 401 || configRes.status === 200) {
        console.log('[PASS] Config API endpoint is responsive.');
    } else {
        console.error(`[FAIL] Config API check failed (${configRes.status}).`);
        process.exit(1);
    }

    console.log('--- TDD Check Complete: API Keys modular structure is valid. ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

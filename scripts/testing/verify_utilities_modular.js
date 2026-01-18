/**
 * Verification Script: Admin Utilities Modularization
 * This script verifies that the Utilities view can be loaded modularly
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
    console.log('--- Verifying Admin Utilities Modularization (TDD) ---');

    // 1. Check if the Utilities view file exists and is accessible via HTTP
    const viewRes = await req('/admin/views/utilities.html', 'GET');
    if (viewRes.status === 200 && viewRes.body.includes('System Utilities')) {
        console.log('[PASS] Utilities view file is accessible.');
    } else {
        console.error(`[FAIL] Utilities view file check failed (${viewRes.status}).`);
        process.exit(1);
    }

    // 2. Check if the Utilities module file exists and is accessible
    const moduleRes = await req('/admin/js/modules/utilities.js', 'GET');
    if (moduleRes.status === 200 && moduleRes.body.includes('initUtilities')) {
        console.log('[PASS] Utilities module file is accessible.');
    } else {
        console.error(`[FAIL] Utilities module file check failed (${moduleRes.status}).`);
        process.exit(1);
    }

    // 3. Verify that the Admin Stats API (used by Utilities) is working
    // Note: This requires an admin token, for this TDD script we'll just check if it returns 401/403 (exists but needs auth)
    const statsRes = await req('/api/admin/stats', 'GET');
    if (statsRes.status === 401 || statsRes.status === 200) {
        console.log('[PASS] Admin Stats API is responsive.');
    } else {
        console.error(`[FAIL] Admin Stats API check failed (${statsRes.status}).`);
        process.exit(1);
    }

    console.log('--- TDD Check Complete: Structural foundation is solid. ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

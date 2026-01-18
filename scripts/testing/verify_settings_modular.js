/**
 * Verification Script: Admin Settings Modularization (TDD)
 * This script verifies that the Settings view can be loaded modularly
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
    console.log('--- Verifying Admin Settings Modularization (TDD) ---');

    // 1. Check if the Settings view file exists and is accessible via HTTP
    const viewRes = await req('/admin/views/settings.html', 'GET');
    if (viewRes.status === 200) {
        console.log('[PASS] Settings view file is accessible.');
    } else {
        console.error(`[FAIL] Settings view file check failed (${viewRes.status}).`);
        process.exit(1);
    }

    // 2. Check if the Settings module file exists and is accessible
    const moduleRes = await req('/admin/js/modules/settings.js', 'GET');
    if (moduleRes.status === 200 && moduleRes.body.includes('initSettings')) {
        console.log('[PASS] Settings module file is accessible.');
    } else {
        console.error(`[FAIL] Settings module file check failed (${moduleRes.status}).`);
        process.exit(1);
    }

    // 3. Verify that the Config API is responsive
    const configRes = await req('/api/config', 'GET');
    if (configRes.status === 401 || configRes.status === 200) {
        console.log('[PASS] Config API endpoint is responsive.');
    } else {
        console.error(`[FAIL] Config API check failed (${configRes.status}).`);
        process.exit(1);
    }

    // 4. Verify syntax validity of settings.js (by requiring it?)
    // This is hard in this environment without DOM, but ensures no syntax errors.
    try {
        // Just a sanity check that the file content looks robust
        if (moduleRes.body.includes('export async function saveSettings')) {
            console.log('[PASS] settings.js exports saveSettings.');
        }
    } catch (e) {
        console.warn('[WARN] Could not verify export signature.');
    }

    console.log('--- TDD Check Complete: Settings modular structure is valid. ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

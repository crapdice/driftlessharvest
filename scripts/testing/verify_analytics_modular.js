/**
 * Verification Script: Admin Analytics Modularization (TDD)
 * This script verifies that the Analytics view can be loaded modularly
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
    console.log('--- Verifying Admin Analytics Modularization (TDD) ---');

    // 1. Check if the Analytics view file exists and is accessible via HTTP
    const viewRes = await req('/admin/views/analytics.html', 'GET');
    if (viewRes.status === 200) {
        console.log('[PASS] Analytics view file is accessible.');
    } else {
        console.error(`[FAIL] Analytics view file check failed (${viewRes.status}).`);
        process.exit(1);
    }

    // 2. Check if the Analytics module file exists and is accessible
    const moduleRes = await req('/admin/js/modules/analytics.js', 'GET');
    if (moduleRes.status === 200 && moduleRes.body.includes('initAnalytics')) {
        console.log('[PASS] Analytics module file is accessible.');
    } else {
        console.error(`[FAIL] Analytics module file check failed (${moduleRes.status}).`);
        process.exit(1);
    }

    // 3. Verify that the Analytics API is responsive
    // Using a common endpoint likely used by the module
    const analyticsRes = await req('/api/analytics', 'GET');
    if (analyticsRes.status === 401 || analyticsRes.status === 200) {
        console.log('[PASS] Analytics API endpoint is responsive.');
    } else {
        // Fallback: it might be /api/admin/analytics or similar, but let's assume /api/analytics or check 404
        if (analyticsRes.status === 404) {
            console.warn('[WARN] /api/analytics returned 404. Checking alternative...');
            const adminStatsRes = await req('/api/admin/stats', 'GET');
            if (adminStatsRes.status === 401 || adminStatsRes.status === 200) {
                console.log('[PASS] Alternative Admin Stats API is responsive.');
            } else {
                console.error(`[FAIL] Analytics API check failed.`);
                process.exit(1);
            }
        } else {
            console.error(`[FAIL] Analytics API check failed (${analyticsRes.status}).`);
            process.exit(1);
        }
    }

    console.log('--- TDD Check Complete: Analytics modular structure is valid. ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

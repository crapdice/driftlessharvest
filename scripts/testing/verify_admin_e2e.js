const http = require('http');
const Database = require('better-sqlite3');

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
    console.log('--- Verifying Admin Features ---');

    // 1. Signup a new user
    const email = `admin_e2e_${Date.now()}@example.com`;
    const signup = await req('/api/auth/signup', 'POST', { email, password: 'password123' });
    const token = signup.body.token;
    const userId = signup.body.user.id;
    console.log(`Signed up User: ${email} (ID: ${userId})`);

    // 2. Promote to Admin (Direct DB)
    try {
        const db = new Database('harvest.db');
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(userId);
        console.log('[PASS] Promoted user to Admin via DB.');
        db.close();
    } catch (e) {
        console.error('[FAIL] DB Promotion failed. Is better-sqlite3 install working?');
        // Continue anyway to see if it fails
    }

    // 3. Verify Admin Access
    const res = await req('/api/admin/stats', 'GET', null, token);
    if (res.status === 200) {
        console.log('[PASS] Admin Access Granted.');
    } else {
        console.error(`[FAIL] Admin Access Denied (${res.status}).`);
        return;
    }

    // 4. Verify Delivery Windows (Filter)
    const windows = await req('/api/admin/delivery-windows', 'GET', null, token);
    const now = new Date().toISOString().split('T')[0];
    const allFuture = windows.body.every(w => w.date_value >= now);
    if (allFuture) console.log('[PASS] Delivery Windows are all future/active.');
    else console.error('[FAIL] Found past delivery windows.', windows.body);

    // 5. Verify Customer Edit (PUT)
    const update = await req(`/api/admin/users/${userId}`, 'PUT', {
        email: email,
        role: 'admin',
        address: { city: 'Test City', zip: '12345' }
    }, token);

    if (update.status === 200) console.log('[PASS] User Update success.');
    else console.error('[FAIL] User Update failed.', update.body);

    // 6. Verify Password Reset (POST)
    const reset = await req(`/api/admin/users/${userId}/reset`, 'POST', {}, token);
    if (reset.status === 200) console.log('[PASS] Password Reset trigger success.');
    else console.error('[FAIL] Password Reset failed.', reset.body);
}

verify().catch(console.error);

const http = require('http');

function req(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = {
            hostname: 'localhost',
            port: 3002,
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
    console.log('--- Verifying RBAC ---');

    // 1. Signup/Login as User
    const email = `testuser${Date.now()}@example.com`;
    const signup = await req('/api/auth/signup', 'POST', { email, password: 'password123' });
    const token = signup.body.token;
    console.log(`User created: ${email}, Role: ${signup.body.user.role}`);

    // 2. Try to access Admin API (Should FAIL 403)
    console.log('Attempting Admin Access (Expect 403)...');
    const adminRes = await req('/api/admin/stats', 'GET', null, token);

    if (adminRes.status === 403) {
        console.log('PASS: Access Denied (403 Forbidden) as expected.');
    } else {
        console.error(`FAIL: Unexpected status ${adminRes.status}`, adminRes.body);
    }
}

verify().catch(console.error);

// Native fetch in Node 18+

const BASE_URL = 'http://localhost:3000/api';

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
    } catch (e) {
        console.error(`❌ ${name}: ${e.message}`);
    }
}

async function request(endpoint, method, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const json = await res.json();
    return { status: res.status, json };
}

(async () => {
    console.log('--- Verifying App Hardening ---');

    await test('Signup: Rejects Invalid Email', async () => {
        const email = `bad-email-${Date.now()}`;
        const res = await request('/auth/signup', 'POST', {
            email: email,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        });
        if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
        if (!res.json.details) throw new Error('Expected validation details');
    });

    await test('Signup: Rejects Short Password', async () => {
        const res = await request('/auth/signup', 'POST', {
            email: `test-${Date.now()}@example.com`,
            password: '123',
            firstName: 'Test',
            lastName: 'User'
        });
        if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });

    const validEmail = `User-${Date.now()}@Example.COM`; // Mixed case
    const normalizedEmail = validEmail.toLowerCase();

    await test('Signup: Accepts Valid Input & Normalizes Email', async () => {
        const res = await request('/auth/signup', 'POST', {
            email: `  ${validEmail}  `, // Whitespace + caps
            password: 'password123',
            firstName: '  John  ',
            lastName: 'Doe',
            phone: '(555) 123-4567'
        });

        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.json)}`);

        if (res.json.user.email !== normalizedEmail) {
            throw new Error(`Email not normalized. Got '${res.json.user.email}', expected '${normalizedEmail}'`);
        }
        if (res.json.user.phone !== '5551234567') {
            throw new Error(`Phone not normalized. Got '${res.json.user.phone}'`);
        }
        if (res.json.user.firstName !== 'John') {
            throw new Error(`Name not trimmed. Got '${res.json.user.firstName}'`);
        }
    });

    console.log('--- Verification Complete ---');
})();

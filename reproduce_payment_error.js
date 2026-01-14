const fetch = require('node-fetch'); // Using localized fetch if available, or I'll use raw http
// Actually, since I am in node env, I can just use native fetch if Node 18+, or http.
// I'll use http to be safe given env.

const http = require('http');

const payload = JSON.stringify({
    items: [{ id: 1, qty: 1, type: 'product' }],
    userEmail: 'testuser@example.com'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/create-payment-intent',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(payload);
req.end();

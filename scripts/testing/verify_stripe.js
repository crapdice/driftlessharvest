
const http = require('http');

const data = JSON.stringify({
    items: [], // Empty items to trigger 400 (Bad Request) instead of 503 (Service Unavailable)
    userEmail: 'test@example.com'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/create-payment-intent',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response Body: ${body}`);

        if (res.statusCode === 503) {
            console.error('FAIL: Stripe not configured correctly (503 Service Unavailable).');
            process.exit(1);
        } else if (res.statusCode === 400 || res.statusCode === 200) {
            console.log('SUCCESS: Stripe is initialized (endpoint reachable).');
            process.exit(0);
        } else {
            console.log('UNKNOWN: Unexpected status code.');
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});

req.write(data);
req.end();

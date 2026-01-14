
require('dotenv').config();
const http = require('http');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const payload = JSON.stringify({
    id: 'evt_test_webhook',
    object: 'event',
});

// Manually generate a valid signature
const now = Math.floor(Date.now() / 1000);
const signedPayload = `${now}.${payload}`;
const signature = stripe.webhooks.generateTestHeaderString({
    payload: payload,
    secret: endpointSecret,
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhook',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);

        if (res.statusCode === 200) {
            console.log('SUCCESS: Webhook signature verified.');
            process.exit(0);
        } else {
            console.error('FAIL: Webhook verification failed.');
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
});

req.write(payload);
req.end();

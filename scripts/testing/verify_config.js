
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/config',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        try {
            const config = JSON.parse(body);
            console.log('Status:', res.statusCode);
            console.log('Config Keys:', Object.keys(config));
            console.log('stripePublishableKey prefix:', config.stripePublishableKey ? config.stripePublishableKey.substring(0, 10) : 'MISSING');

            if (config.stripePublishableKey && config.stripePublishableKey.startsWith('pk_test')) {
                console.log('SUCCESS: Publishable key is exposed.');
                process.exit(0);
            } else {
                console.error('FAIL: Publishable key is missing or invalid.');
                process.exit(1);
            }
        } catch (e) {
            console.error('Failed to parse JSON', e);
            console.log('Body:', body);
            process.exit(1);
        }
    });
});
req.end();

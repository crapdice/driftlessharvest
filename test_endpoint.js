// Node 18+ has global fetch
async function testEndpoint() {
    console.log('Testing Endpoint: http://localhost:3000/api/create-payment-intent');

    const body = {
        items: [{ id: 1, type: 'product', qty: 1, price: 4.5, name: 'Heirloom Tomatoes' }],
        userEmail: 'test-endpoint@example.com',
        shipping: {
            name: 'Test Endpoint User',
            address: '123 Fake St',
            city: 'Testville',
            state: 'TS',
            zip: '12345',
            date: 'Thursday'
        }
    };

    try {
        const res = await fetch('http://localhost:3000/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);

        try {
            const json = await res.json();
            console.log('Response JSON:', JSON.stringify(json, null, 2));
        } catch (e) {
            const text = await res.text();
            console.log('Response Text:', text);
        }

    } catch (e) {
        console.error('Fetch Failed:', e.message);
    }
}

testEndpoint();

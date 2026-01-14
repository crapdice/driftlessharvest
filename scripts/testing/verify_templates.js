const http = require('http');

const PORT = 3000;
const AUTH = 'Basic ' + Buffer.from('admin:secret').toString('base64');

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH,
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    console.error("RAW RESPONSE:", data);
                    reject(e);
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function run() {
    try {
        console.log("1. Creating Product...");
        const pRes = await request('POST', '/admin/products', {
            name: 'Template Apple',
            price: 1,
            category: 'fruit',
            stock: 100, // Stock is 100
            image_url: 'http://example.com'
        });
        if (pRes.status !== 200) throw new Error('Create Product Failed: ' + JSON.stringify(pRes));
        const prodId = pRes.body.id;
        console.log("   Product ID:", prodId);

        console.log("2. Creating Template...");
        const tRes = await request('POST', '/admin/box-templates', {
            name: 'Apple Box',
            description: 'Box of apples',
            price: 10,
            items: [{ id: prodId, qty: 5 }] // Uses 5 apples
        });
        if (tRes.status !== 200) throw new Error('Create Template Failed: ' + JSON.stringify(tRes));
        const tmplId = tRes.body.id;
        console.log("   Template ID:", tmplId);

        console.log("3. Reserving Template...");
        const rRes = await request('POST', '/cart/reserve-template', {
            templateId: tmplId
        });
        if (rRes.status !== 200) throw new Error('Reserve Template Failed: ' + JSON.stringify(rRes));
        console.log("   Reserved:", rRes.body);

        console.log("4. Verifying Stock...");
        const listRes = await request('GET', '/products');
        const product = listRes.body.find(p => p.id === prodId);
        if (!product) throw new Error('Product not found in list');

        // Initial 100, reserved 5 -> 95
        if (product.stock === 95) {
            console.log("SUCCESS! Stock is 95.");
        } else {
            throw new Error(`Stock mismatch. Expected 95, got ${product.stock}`);
        }

        console.log("5. Creating Order with Delivery Window...");
        const oRes = await request('POST', '/orders', {
            userEmail: 'test@example.com',
            total: 10,
            deliveryWindow: 'Tuesday, Jan 14th',
            shippingCoords: {},
            items: [{ id: prodId, qty: 1 }]
        });
        if (oRes.status !== 200) throw new Error('Create Order Failed: ' + JSON.stringify(oRes));
        console.log("   Order Created:", oRes.body.orderId);

        console.log("6. Checking Delivery Schedule...");
        const sRes = await request('GET', '/admin/delivery-schedule');
        if (sRes.status !== 200) throw new Error('Get Schedule Failed: ' + JSON.stringify(sRes));
        console.log("   Schedule:", sRes.body);

        const sched = sRes.body.find(s => s.date === 'Tuesday, Jan 14th');
        if (sched && sched.count >= 1) {
            console.log("SUCCESS! Schedule updated.");
        } else {
            throw new Error("Schedule mismatch: " + JSON.stringify(sRes.body));
        }

    } catch (err) {
        console.error("FAILED:", err);
        process.exit(1);
    }
}

run();

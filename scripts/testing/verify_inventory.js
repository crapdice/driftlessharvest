const http = require('http');

function doesRequest(url, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body || options.body; // Fix: Support standard fetch style
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 3000,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        json: () => JSON.parse(data),
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) { reject(e); }
            });
        });

        req.on('error', (e) => reject(e));
        if (payload) req.write(payload);
        req.end();
    });
}
const fetch = doesRequest; // Alias for minimal code change


const API_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'admin@harvest.com';
const ADMIN_PASSWORD = 'password123';

async function runTest() {
    console.log("1. Authenticating as Admin...");
    let token;
    try {
        const authRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const authData = await authRes.json();
        console.log("Auth Response:", JSON.stringify(authData)); // Debug
        if (!authData.token) throw new Error("Login failed: " + JSON.stringify(authData));
        token = authData.token;
        console.log("   Authenticated.");
    } catch (e) {
        console.error("   Authentication Failed:", e.message);
        process.exit(1);
    }

    console.log("\n2. Creating Test Product with Stock = 1...");
    const productPayload = {
        name: "Test Stock Item",
        category: "Test",
        price: 10.00,
        image_url: "",
        tags: ["test"],
        stock: 1
    };

    let productId;
    try {
        const createRes = await fetch(`${API_URL}/admin/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        });
        const createData = await createRes.json();
        productId = createData.id;
        console.log("   Created Product ID:", productId);
    } catch (e) {
        console.error("   Failed to create product:", e);
        return;
    }

    console.log("\n3. Placing Order for 1x Test Item...");
    const orderPayload = {
        user_email: "test@example.com",
        items: [{ id: productId, name: "Test Stock Item", price: 10.00, qty: 1 }],
        total: 10.00,
        shipping: {
            name: "Test User",
            street: "123 Test St",
            city: "Testville",
            state: "WI",
            zip: "54665",
            date: "Thursday"
        }
    };

    try {
        const orderRes = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const orderData = await orderRes.json();
        if (!orderData.success) {
            console.error("   Order Failed:", orderData);
        } else {
            console.log("   Order Placed ID:", orderData.orderId);
        }
    } catch (e) {
        console.error("   Order Exception:", e);
    }

    console.log("\n4. Verifying Stock (Should be 0)...");
    try {
        const productsRes = await fetch(`${API_URL}/products`);
        const products = await productsRes.json();
        const targetProduct = products.find(p => p.id === productId);

        console.log(`   Stock Level: ${targetProduct.stock}`);
        if (targetProduct.stock === 0) {
            console.log("   SUCCESS: Stock decremented correctly.");
        } else {
            console.log("   FAILURE: Stock did not decrement.");
        }
    } catch (e) {
        console.error("   Verification Failed:", e);
    }

    // 4.5 Verify Oversell Protection
    console.log("\n4.5. Attempting to buy again (Should Fail)...");
    try {
        const failRes = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const failData = await failRes.json();
        if (!failData.success && failData.details && failData.details.includes('Insufficient stock')) {
            console.log("   SUCCESS: Oversell prevented. Error: " + failData.details);
        } else {
            console.log("   FAILURE: Order should have failed but got: " + JSON.stringify(failData));
        }
    } catch (e) {
        console.log("   Exception caught (Good):", e.message);
    }

    // Cleanup
    console.log("\n5. Cleaning up...");
    await fetch(`${API_URL}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

runTest();

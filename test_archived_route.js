const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./server/middleware/auth');

// 1. Generate Admin Token
const adminToken = jwt.sign({
    id: 'admin_test',
    email: 'admin@harvest.local',
    role: 'super_admin'
}, 'dev-secret-123', { expiresIn: '1h' });

// 2. Invoke API
(async () => {
    try {
        console.log(`Testing Route: /api/admin/products/archived`);

        const res = await fetch(`http://localhost:3000/api/admin/products/archived`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Success, Items:', data.length);
        } else {
            console.log('Error:', await res.text());
        }

    } catch (e) {
        console.error('Fetch Error:', e);
    }
})();

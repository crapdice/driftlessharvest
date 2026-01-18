require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server/app');
const jwt = require('jsonwebtoken');

describe('Admin Utilities: Table Inspection TDD', () => {
    let token;
    // Match the fallback in server/middleware/auth.js
    const JWT_SECRET = process.env.JWT_SECRET || 'harvest-secret-key-change-in-prod';

    before(() => {
        // Create an admin token to bypass checkRole middleware
        token = jwt.sign(
            { id: 1, email: 'admin@driftlessharvest.com', role: 'super_admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    const tables = [
        'users', 'orders', 'products', 'delivery_windows', 'addresses',
        'categories', 'farms', 'order_items', 'active_carts', 'payments',
        'box_templates', 'box_items', 'analytics_events', 'launch_signups'
    ];

    tables.forEach(table => {
        it(`should successfully query the "${table}" table`, async () => {
            const res = await request(app)
                .get(`/api/admin/utilities/query/${table}`)
                .set('Authorization', `Bearer ${token}`);

            if (res.status !== 200) {
                console.error(`Error querying table "${table}":`, res.body);
            }

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('results');
        });
    });
});

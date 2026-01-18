const request = require('supertest');
const { expect } = require('chai');
const app = require('../../server/app.js');
const db = require('../../server/db/index.js');

describe('Marketing API Contract Tests', () => {
    let adminToken;

    before(async () => {
        // Log in to get an admin token
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'admin@driftlessharvest.com',
                password: process.env.ADMIN_PASSWORD || 'password123'
            });
        adminToken = res.body.token;
    });

    it('GET /api/admin/marketing/signups should return an array of signups', async () => {
        const res = await request(app)
            .get('/api/admin/marketing/signups')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array');
    });

    it('GET /api/admin/marketing/stats should return aggregated variant stats', async () => {
        const res = await request(app)
            .get('/api/admin/marketing/stats')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array');
        if (res.body.length > 0) {
            expect(res.body[0]).to.have.property('variant');
            expect(res.body[0]).to.have.property('count');
        }
    });

    it('POST /api/config should allow updating marketing meta settings', async () => {
        const testConfig = {
            meta: {
                activeLaunchVariant: 'Hearth & Harvest (Design 1)',
                launchModeEnabled: true
            }
        };

        const res = await request(app)
            .post('/api/config')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(testConfig);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
    });
});

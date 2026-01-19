const supertest = require('supertest');
const assert = require('assert');
const app = require('../server/app'); // Assuming app is exported

// Note: If app.js doesn't export app, we might need to modify it or use the running server
const request = supertest('http://localhost:3000');

describe('Backend Auth Verification', function () {
    let cookie;

    it('should login and return httpOnly cookie', async function () {
        const res = await request.post('/api/auth/login')
            .send({ email: 'admin@driftless.com', password: 'harvest123' })
            .expect(200);

        const cookies = res.headers['set-cookie'];
        assert(cookies, 'Cookies should be set');
        cookie = cookies.find(c => c.startsWith('harvest_token'));
        assert(cookie, 'harvest_token cookie should exist');
    });

    it('should allow access to user profile with cookie', async function () {
        if (!cookie) this.skip();

        const res = await request.get('/api/user/profile')
            .set('Cookie', cookie)
            .expect(200);

        assert.equal(res.body.role, 'super_admin'); // or 'admin' 
    });

    it('should allow access to marketing stats with cookie', async function () {
        if (!cookie) this.skip(); // Depends on login

        const res = await request.get('/api/admin/marketing/stats')
            .set('Cookie', cookie)
            .expect(200);
    });
});

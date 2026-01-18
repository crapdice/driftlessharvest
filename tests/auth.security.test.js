require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server/app');

describe('Cookie-Based Auth Security (TDD: Phase 1)', () => {
    describe('POST /api/auth/login', () => {
        it('should set HttpOnly cookie on successful login', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@driftlessharvest.com', password: 'admin123' });

            expect(res.status).to.equal(200);
            expect(res.headers['set-cookie']).to.exist;

            const cookie = res.headers['set-cookie'][0];
            expect(cookie).to.include('harvest_token=');
            expect(cookie).to.include('HttpOnly');
            expect(cookie).to.include('SameSite=Strict');
        });

        it('should NOT return token in response body', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@driftlessharvest.com', password: 'admin123' });

            expect(res.status).to.equal(200);
            expect(res.body).to.not.have.property('token');
            expect(res.body).to.have.property('user');
        });
    });

    describe('Authenticated API Requests', () => {
        it('should accept cookie-based authentication', async () => {
            // Login first
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@driftlessharvest.com', password: 'admin123' });

            const cookie = loginRes.headers['set-cookie'];

            // Use cookie for authenticated request
            const res = await request(app)
                .get('/api/user/profile')
                .set('Cookie', cookie);

            expect(res.status).to.equal(200);
            expect(res.body.email).to.equal('admin@driftlessharvest.com');
        });

        it('should reject requests without cookie', async () => {
            const res = await request(app)
                .get('/api/user/profile');

            expect(res.status).to.equal(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should clear the auth cookie', async () => {
            // Login first
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@driftlessharvest.com', password: 'admin123' });

            const cookie = loginRes.headers['set-cookie'];

            // Logout
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', cookie);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;

            const clearCookie = res.headers['set-cookie'][0];
            expect(clearCookie).to.include('harvest_token=;');
        });
    });

    describe('POST /api/auth/signup', () => {
        it('should set HttpOnly cookie on successful signup', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: `test${Date.now()}@example.com`,
                    password: 'password123'
                });

            expect(res.status).to.equal(201);
            expect(res.headers['set-cookie']).to.exist;

            const cookie = res.headers['set-cookie'][0];
            expect(cookie).to.include('harvest_token=');
            expect(cookie).to.include('HttpOnly');
        });
    });
});

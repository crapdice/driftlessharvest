const request = require('supertest');
const { expect } = require('chai');
const app = require('../../server/app');
const sinon = require('sinon');
const cloudflareService = require('../../server/services/cloudflareService');

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../server/middleware/auth');

describe('Image Routes Integration', () => {
    let getPresignedStub;
    let adminToken;

    beforeEach(() => {
        getPresignedStub = sinon.stub(cloudflareService, 'getPresignedUploadUrl');
        adminToken = jwt.sign({ id: 1, email: 'admin@test.com', role: 'admin' }, JWT_SECRET);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('GET /api/images/presigned-url', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/images/presigned-url?filename=test.jpg&contentType=image/jpeg');

            expect(response.status).to.equal(401);
        });

        it('should return a pre-signed URL when valid and authenticated', async () => {
            getPresignedStub.resolves({
                uploadUrl: 'https://r2.test/upload',
                publicUrl: 'https://r2.test/public/test.jpg',
                key: 'default/misc/test.jpg'
            });

            const response = await request(app)
                .get('/api/images/presigned-url?filename=test.jpg&contentType=image/jpeg')
                .set('Cookie', [`harvest_token=${adminToken}`]);

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('uploadUrl', 'https://r2.test/upload');
            expect(response.body).to.have.property('publicUrl', 'https://r2.test/public/test.jpg');
        });

        it('should return 400 if filename is missing', async () => {
            const response = await request(app)
                .get('/api/images/presigned-url?contentType=image/jpeg')
                .set('Cookie', [`harvest_token=${adminToken}`]);

            expect(response.status).to.equal(400);
        });
    });
});

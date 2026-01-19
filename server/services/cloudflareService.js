const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

/**
 * CloudflareService handles interactions with Cloudflare R2 (S3-compatible)
 */
class CloudflareService {
    constructor() {
        this.client = null;
        this.bucket = null;
        this.accountId = null;
    }

    /**
     * Re-initializes the S3 client using the latest config
     */
    async _init() {
        if (!fs.existsSync(CONFIG_FILE)) {
            throw new Error('Configuration file not found');
        }

        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        const cf = config.apiKeys?.cloudflare;

        if (!cf || !cf.accountId || !cf.accessKeyId || !cf.secretAccessKey || !cf.r2Bucket) {
            throw new Error('Cloudflare R2 is not configured');
        }

        this.accountId = cf.accountId;
        this.bucket = cf.r2Bucket;
        this.publicUrl = cf.publicUrl || null;

        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${cf.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: cf.accessKeyId,
                secretAccessKey: cf.secretAccessKey,
            },
        });
    }

    /**
     * Generates a pre-signed URL for a direct upload
     * @param {Object} options 
     * @param {string} options.filename - The name of the file
     * @param {string} options.contentType - MIME type
     * @param {string} options.tenantId - The tenant ID for isolation
     * @param {string} options.category - 'products', 'templates', etc.
     */
    async getPresignedUploadUrl({ filename, contentType, tenantId = 'default', category = 'misc' }) {
        await this._init();

        const sanitizedFilename = filename.replace(/[^a-z0-9._-]/gi, '_');
        const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
        const key = `${tenantId}/${category}/${uniqueFilename}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });

        // Final Public URL
        const base = this.publicUrl
            ? this.publicUrl.replace(/\/$/, '')
            : `https://${this.bucket}.${this.accountId}.r2.cloudflarestorage.com`;

        const publicUrl = `${base}/${key}`;

        return {
            uploadUrl,
            publicUrl,
            key
        };
    }
}

module.exports = new CloudflareService();

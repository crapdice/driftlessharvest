const express = require('express');
const router = express.Router();
const cloudflareService = require('../../services/cloudflareService');
const { checkRole } = require('../../middleware/auth');

/**
 * GET /api/images/presigned-url
 * Returns a pre-signed URL for direct upload to R2
 */
router.get('/images/presigned-url', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { filename, contentType, category } = req.query;

        if (!filename || !contentType) {
            return res.status(400).json({ error: 'filename and contentType are required' });
        }

        const data = await cloudflareService.getPresignedUploadUrl({
            filename,
            contentType,
            category: category || 'misc',
            tenantId: req.tenant?.id || 'default'
        });

        res.json(data);
    } catch (error) {
        console.error('[Image Routes] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

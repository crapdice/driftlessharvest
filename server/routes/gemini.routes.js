const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const { checkRole } = require('../middleware/auth');

// POST /api/gemini/generate
router.post('/gemini/generate', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { prompt, context } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const text = await geminiService.generateContent(prompt, context);
        res.json({ text });

    } catch (error) {
        // Detailed error logging (server-side)
        console.error('Gemini Route Error:', error);

        // Client-facing error handling
        if (error.message.includes('API key not configured')) {
            return res.status(401).json({ error: 'Gemini API Key is missing or invalid' });
        }

        // Return 502 for upstream failures to distinguish from app crashes
        res.status(502).json({ error: error.message || 'Failed to generate content' });
    }
});

// GET /api/gemini/models
router.get('/gemini/models', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const models = await geminiService.listModels();
        res.json({ models });
    } catch (error) {
        console.error('Gemini List Models Error:', error);
        res.status(502).json({ error: error.message || 'Failed to list models' });
    }
});

// POST /api/gemini/test-generate
router.post('/gemini/test-generate', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { prompt, model } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const text = await geminiService.generateContent(prompt, '', model);
        res.json({ text });
    } catch (error) {
        console.error('Gemini Test Generate Error:', error);
        res.status(502).json({ error: error.message || 'Generation failed' });
    }
});

// POST /api/gemini/test (Connection Check)
router.post('/gemini/test', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const result = await geminiService.testConnection();
        res.json({ success: true, message: 'Gemini API Connected Successfully', models: result.models });
    } catch (error) {
        console.error('Gemini Test Error:', error);
        res.status(500).json({ error: error.message || 'Connection Failed' });
    }
});

// POST /api/gemini/generate-image
router.post('/gemini/generate-image', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { prompt, model } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const result = await geminiService.generateImage(prompt, model);
        res.json(result);
    } catch (error) {
        console.error('Gemini Image Gen Error:', error);
        res.status(502).json({ error: error.message || 'Image generation failed' });
    }
});

// POST /api/gemini/generate-video
router.post('/gemini/generate-video', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { prompt, model } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const operation = await geminiService.generateVideo(prompt, model);
        res.json({ operation });
    } catch (error) {
        console.error('Gemini Video Gen Error:', error);
        res.status(502).json({ error: error.message || 'Video generation failed' });
    }
});

// GET /api/gemini/operation?name=operations/123...
router.get('/gemini/operation', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const name = req.query.name;
        if (!name) return res.status(400).json({ error: 'Operation name required' });

        const result = await geminiService.getOperation(name);
        res.json(result);
    } catch (error) {
        console.error('Gemini Get Op Error:', error);
        res.status(502).json({ error: error.message || 'Failed to get operation' });
    }
});

// GET /api/gemini/proxy-media?url=...
router.get('/gemini/proxy-media', checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const fileUrl = req.query.url;
        if (!fileUrl) return res.status(400).json({ error: 'URL required' });

        const range = req.headers.range;
        const { stream, status, headers } = await geminiService.proxyMedia(fileUrl, range);

        // Pass essential headers back to the client
        res.status(status);
        if (headers['content-type']) res.setHeader('Content-Type', headers['content-type']);
        if (headers['content-length']) res.setHeader('Content-Length', headers['content-length']);
        if (headers['content-range']) res.setHeader('Content-Range', headers['content-range']);
        if (headers['accept-ranges']) res.setHeader('Accept-Ranges', headers['accept-ranges']);

        stream.pipe(res);
    } catch (error) {
        console.error('Gemini Proxy Route Error:', error);
        res.status(502).json({ error: error.message || 'Failed to proxy media' });
    }
});

module.exports = router;

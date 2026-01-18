const fs = require('fs/promises');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'config.json');

class GeminiService {
    async generateContent(prompt, context = '', model = 'gemini-2.5-flash') {
        try {
            // Load API Key from config
            const configStr = await fs.readFile(DATA_FILE, 'utf8');
            const config = JSON.parse(configStr);
            const apiKey = config.apiKeys?.gemini;

            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            // Construct the full prompt
            const fullPrompt = context
                ? `${context}\n\nTask: ${prompt}`
                : prompt;

            // Use confirmed working model
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: fullPrompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorDetails;
                try {
                    errorDetails = JSON.parse(errorText);
                } catch (e) {
                    errorDetails = { message: errorText };
                }

                console.error(`Gemini API Error (${response.status} ${response.statusText}):`, JSON.stringify(errorDetails, null, 2));
                throw new Error(errorDetails.error?.message || `Gemini API Request Failed (${response.status})`);
            }

            const data = await response.json();

            // Extract text from response
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                console.error('Gemini Empty Response:', JSON.stringify(data, null, 2));
                throw new Error('No content generation returned from AI');
            }

            return generatedText;

        } catch (error) {
            console.error('GeminiService Error:', error);
            throw error;
        }
    }

    async testConnection() {
        // Reuse listModels for connection test
        const models = await this.listModels();
        return { success: true, models: models.map(m => m.name) };
    }

    async listModels() {
        try {
            const configStr = await fs.readFile(DATA_FILE, 'utf8');
            const config = JSON.parse(configStr);
            const apiKey = config.apiKeys?.gemini;

            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to list models: ${errorText}`);
            }

            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Gemini List Models Error:', error);
            throw error;
        }
    }

    async generateImage(prompt, model = 'imagen-4.0-fast-generate-001') {
        try {
            const configStr = await fs.readFile(DATA_FILE, 'utf8');
            const apiKey = JSON.parse(configStr).apiKeys?.gemini;
            if (!apiKey) throw new Error('Gemini API key not configured');

            const isGeminiModel = model.toLowerCase().includes('gemini');
            const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;
            const keyParam = `?key=${apiKey.trim()}`;

            if (isGeminiModel) {
                // Gemini models use generateContent with responseModalities
                const url = `${baseUrl}:generateContent${keyParam}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseModalities: ["IMAGE"]
                        }
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    this._handleError(response, errorText);
                }

                const data = await response.json();
                const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

                if (!part || !part.inlineData) {
                    throw new Error('AI did not return an image part. Check if the model supports generation or if your prompt was blocked.');
                }

                return {
                    mimeType: part.inlineData.mimeType || 'image/png',
                    b64: part.inlineData.data
                };

            } else {
                // Imagen models use predict
                const url = `${baseUrl}:predict${keyParam}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: prompt }],
                        parameters: { sampleCount: 1 }
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    this._handleError(response, errorText);
                }

                const data = await response.json();
                const image = data.predictions?.[0];

                if (!image || !image.bytesBase64Encoded) {
                    throw new Error('No image returned from Imagen');
                }

                return {
                    mimeType: image.mimeType || 'image/png',
                    b64: image.bytesBase64Encoded
                };
            }
        } catch (error) {
            console.error('Gemini Image Gen Error:', error);
            throw error;
        }
    }

    _handleError(response, errorText) {
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch (e) {
            errorData = { error: { message: errorText } };
        }

        const msg = errorData.error?.message || 'Unknown error';

        // Specific helpful message for "limit: 0" or billing errors
        if (msg.includes('limit: 0') || msg.includes('billed users')) {
            throw new Error(`Media Generation (Image/Video) is restricted: ${msg}. TIP: Google often requires a linked Billing Account (even for free tier) to enable these advanced models.`);
        }

        throw new Error(`Gemini API Error (${response.status}): ${msg}`);
    }

    async generateVideo(prompt, model = 'veo-2.0-generate-001') {
        try {
            const configStr = await fs.readFile(DATA_FILE, 'utf8');
            const apiKey = JSON.parse(configStr).apiKeys?.gemini;
            if (!apiKey) throw new Error('Gemini API key not configured');

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${apiKey.trim()}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: prompt }],
                    parameters: {} // Default params
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                this._handleError(response, errorText);
            }

            const data = await response.json();
            // Expected: { name: "operations/...", metadata: { ... } }
            return data;
        } catch (error) {
            console.error('Gemini Video Gen Error:', error);
            throw error;
        }
    }

    async getOperation(name) {
        try {
            const configStr = await fs.readFile(DATA_FILE, 'utf8');
            const apiKey = JSON.parse(configStr).apiKeys?.gemini;
            if (!apiKey) throw new Error('Gemini API key not configured');

            // Name is like "operations/12345...", needs to be passed in URL
            const url = `https://generativelanguage.googleapis.com/v1beta/${name}?key=${apiKey.trim()}`;

            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                this._handleError(response, errorText);
            }

            return await response.json();
        } catch (error) {
            console.error('Gemini Get Op Error:', error);
            throw error;
        }
    }

    async proxyMedia(fileUrl, rangeHeader) {
        try {
            const configStr = await fs.readFile(DATA_FILE, 'utf8');
            const apiKey = JSON.parse(configStr).apiKeys?.gemini;
            if (!apiKey) throw new Error('Gemini API key not configured');

            const url = new URL(fileUrl);
            url.searchParams.set('key', apiKey.trim());

            const fetchOptions = { redirect: 'follow' };
            if (rangeHeader) {
                fetchOptions.headers = { 'Range': rangeHeader };
            }

            const response = await fetch(url.toString(), fetchOptions);

            console.log(`Gemini Proxy: ${url.toString()}, Status: ${response.status}, Range: ${rangeHeader || 'none'}`);

            if (!response.ok && response.status !== 206) {
                const errorText = await response.text();
                throw new Error(`Media Proxy Failed (${response.status}): ${errorText}`);
            }

            return {
                stream: response.body, // node-fetch body is a stream
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            console.error('Gemini Proxy Media Error:', error);
            throw error;
        }
    }
}

module.exports = new GeminiService();

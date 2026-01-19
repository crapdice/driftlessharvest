const fs = require('fs/promises');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'config.json');

class GeminiService {
    async generateContent(prompt, context = '', model = 'gemini-2.5-flash', imageSource = null) {
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

            const parts = [{ text: fullPrompt }];

            if (imageSource) {
                const isUrl = imageSource.startsWith('http');
                if (isUrl) {
                    const imgRes = await fetch(imageSource);
                    const buffer = await imgRes.arrayBuffer();
                    const b64 = Buffer.from(buffer).toString('base64');
                    parts.push({ inlineData: { mimeType: imgRes.headers.get('content-type') || 'image/jpeg', data: b64 } });
                } else {
                    parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageSource.split(',')[1] || imageSource } });
                }
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: parts
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

    async enhanceImage(imageSource, type, contextData = {}) {
        try {
            // Step 1: Generate an Enhancement Prompt using Gemini 1.5 Flash (Vision)
            let analysisPrompt = '';
            if (type === 'product') {
                analysisPrompt = `Analyze this product image of "${contextData.name || 'a product'}" in the category "${contextData.category || 'General'}". 
                Generate a highly detailed, professional photography prompt for Google Imagen to create an ENHANCED version of this EXACT product.
                The enhanced version should:
                1. Feature vibrant, organic colors and perfect outdoor lighting.
                2. Have a shallow depth of field (blurred background).
                3. Look premium, appetizing, and fresh.
                4. Maintain the core identity of the product shown.
                Return ONLY the prompt text.`;
            } else {
                analysisPrompt = `Analyze this box template image for "${contextData.name || 'a subscription box'}". Description: ${contextData.description || 'N/A'}.
                Generate a highly detailed, professional prompt for Google Imagen to create an ENHANCED lifestyle version of this EXACT box.
                The enhanced version should:
                1. Show the box in a beautiful, natural setting (e.g., a rustic wooden table).
                2. Feature warm, inviting lighting.
                3. Look premium and high-end.
                4. Maintain the brand identity of the box.
                Return ONLY the prompt text.`;
            }

            const enhancementPrompt = await this.generateImageAnalysis(imageSource, analysisPrompt);
            console.log('Generated Enhancement Prompt:', enhancementPrompt);

            // Step 2: Generate the Enhanced Image using Imagen
            const result = await this.generateImage(enhancementPrompt);
            return {
                ...result,
                promptUsed: enhancementPrompt
            };

        } catch (error) {
            console.error('Gemini Enhance Image Error:', error);
            throw error;
        }
    }

    async generateImageAnalysis(imageSource, prompt) {
        const configStr = await fs.readFile(DATA_FILE, 'utf8');
        const apiKey = JSON.parse(configStr).apiKeys?.gemini;
        if (!apiKey) throw new Error('Gemini API key not configured');

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

        const isUrl = imageSource.startsWith('http');
        const body = {
            contents: [{
                parts: [
                    { text: prompt },
                    isUrl ? { fileData: { mimeType: 'image/jpeg', fileUri: imageSource } } : { inlineData: { mimeType: 'image/jpeg', data: imageSource.split(',')[1] || imageSource } }
                ]
            }]
        };

        // If it's a URL, Gemini might not be able to fetch it directly via fileData unless it's a Google Cloud Storage URI.
        // For public URLs, it's better to download it first or use a different part type. 
        // Actually, for public URLs, we can just pass the URL if the model supports it, but standard Gemini API usually expects inlineData or GCS URIs.
        // Let's download the image if it's a URL to be safe.

        if (isUrl) {
            const imgRes = await fetch(imageSource);
            const buffer = await imgRes.arrayBuffer();
            const b64 = Buffer.from(buffer).toString('base64');
            body.contents[0].parts[1] = { inlineData: { mimeType: imgRes.headers.get('content-type') || 'image/jpeg', data: b64 } };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini Analysis Failed: ${errorText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Professional food photography of a fresh product';
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

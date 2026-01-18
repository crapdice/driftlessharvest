const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/config.json');

async function testApi() {
    const configStr = await fs.readFile(DATA_FILE, 'utf8');
    const apiKey = JSON.parse(configStr).apiKeys?.gemini;
    if (!apiKey) {
        console.error('API Key not found');
        return;
    }

    const testPrompt = 'A pixel art apple on a white background';
    const results = {};

    // 1. Test gemini-2.5-flash-image (generateContent)
    console.log('--- Testing gemini-2.5-flash-image ---');
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: testPrompt }] }],
                generationConfig: {
                    responseModalities: ["IMAGE"]
                }
            })
        });
        results.gemini_image = await res.json();
        results.gemini_image_status = res.status;
    } catch (e) { results.gemini_image_error = e.message; }

    // 2. Test imagen-4.0-fast-generate-001 (predict)
    console.log('--- Testing imagen-4.0-fast-generate-001 ---');
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: testPrompt }],
                parameters: { sampleCount: 1 }
            })
        });
        results.imagen_fast = await res.json();
        results.imagen_fast_status = res.status;
    } catch (e) { results.imagen_fast_error = e.message; }

    // 3. Test gemini-2.0-flash-exp-image-generation
    console.log('--- Testing gemini-2.0-flash-exp-image-generation ---');
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: testPrompt }] }],
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"]
                }
            })
        });
        results.gemini_exp_image = await res.json();
        results.gemini_exp_image_status = res.status;
    } catch (e) { results.gemini_exp_image_error = e.message; }

    await fs.writeFile(path.join(__dirname, 'api_responses.json'), JSON.stringify(results, null, 2));
    console.log('Results written to server/scripts/api_responses.json');
}

testApi();

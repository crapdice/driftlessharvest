const fs = require('fs/promises');
const path = require('path');

async function checkModels() {
    try {
        const configPath = path.join(__dirname, '../data/config.json');
        const configStr = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configStr);
        const apiKey = config.apiKeys?.gemini;

        if (!apiKey) {
            console.error('No Gemini API key found in config.json');
            return;
        }

        console.log('Checking models with key:', apiKey.substring(0, 10) + '...');

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error);
            return;
        }

        console.log('\nAvailable Models for generateContent:');
        const models = data.models || [];

        const output = JSON.stringify(models.map(m => ({
            name: m.name,
            methods: m.supportedGenerationMethods
        })), null, 2);

        await fs.writeFile(path.join(__dirname, 'models.json'), output);
        console.log('Models written to server/scripts/models.json');

    } catch (error) {
        console.error('Script Error:', error);
    }
}

checkModels();

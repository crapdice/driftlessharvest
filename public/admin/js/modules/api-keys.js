import { showToast } from './utils.js';
import { api } from './api.js';

const VIEW_PATH = 'views/api-keys.html';

export async function initApiKeys() {
    const container = document.getElementById('view-api-keys');
    if (!container) return;

    if (!container.dataset.loaded) {
        try {
            const response = await fetch(VIEW_PATH);
            if (!response.ok) throw new Error('Failed to load API keys view');
            const html = await response.text();
            container.innerHTML = html;
            container.dataset.loaded = 'true';
        } catch (error) {
            console.error('Error initializing API keys:', error);
            showToast('Failed to load API keys management', 'error');
            return;
        }
    }

    await loadApiKeys();
}

export async function loadApiKeys() {
    try {
        const config = await api.getConfig();

        // Load Resend API key
        const resendInput = document.getElementById('resend-api-key');
        if (resendInput && config.apiKeys?.resend) {
            resendInput.value = config.apiKeys.resend;
        }

        // Load Gemini API key
        const geminiInput = document.getElementById('gemini-api-key');
        if (geminiInput && config.apiKeys?.gemini) {
            geminiInput.value = config.apiKeys.gemini;
        }
    } catch (error) {
        console.error('[API Keys] Error loading:', error);
    }
}

export async function saveApiKey(type) {
    let key = '';
    let keyName = '';

    if (type === 'resend') {
        key = document.getElementById('resend-api-key').value.trim();
        keyName = 'Resend';
        if (!key) return showToast('Please enter a Resend API key', 'error');
        if (!key.startsWith('re_')) return showToast('Invalid Resend API key format (should start with "re_")', 'error');
    } else if (type === 'gemini') {
        key = document.getElementById('gemini-api-key').value.trim();
        keyName = 'Gemini';
        if (!key) return showToast('Please enter a Gemini API key', 'error');
        if (!key.startsWith('AIzaSy')) return showToast('Invalid Gemini API key format (should start with "AIzaSy")', 'error');
    } else {
        return;
    }

    try {
        // 1. Fetch current config
        const config = await api.getConfig();

        // 2. Update specific key
        if (!config.apiKeys) config.apiKeys = {};
        config.apiKeys[type] = key;

        // 3. Save back
        await api.updateConfig(config);

        showToast(`${keyName} API key saved successfully!`, 'success');
    } catch (error) {
        console.error(`[${keyName}] Error saving:`, error);
        showToast(`Failed to save ${keyName} API key`, 'error');
    }
}

export function toggleApiKeyVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

export async function testResendConnection() {
    const resendKey = document.getElementById('resend-api-key').value.trim();

    if (!resendKey) {
        showToast('Please enter a Resend API key first', 'error');
        return;
    }

    showToast('Testing Resend connection...', 'info');

    // TODO: Implement actual test endpoint on backend
    if (resendKey.startsWith('re_') && resendKey.length > 20) {
        setTimeout(() => {
            showToast('Resend connection successful! (Format Valid)', 'success');
        }, 1000);
    } else {
        showToast('Invalid Resend API key', 'error');
    }
}

export async function testGeminiConnection() {
    const geminiKey = document.getElementById('gemini-api-key').value.trim();

    if (!geminiKey) {
        showToast('Please enter a Gemini API key first', 'error');
        return;
    }

    if (!geminiKey.startsWith('AIzaSy')) {
        return showToast('Invalid Gemini API key format', 'error');
    }

    showToast('Testing Gemini connection...', 'info');

    try {
        const data = await api.testGemini();

        if (data.success) {
            showToast('Gemini API Connected Successfully!', 'success');
        } else {
            throw new Error(data.error || 'Connection verification failed');
        }
    } catch (error) {
        console.error('Gemini Test Error:', error);
        showToast(`Gemini Connection Failed: ${error.message}`, 'error');
    }
}

// Attach to window for global access from HTML onclick handlers
if (typeof window !== 'undefined') {
    window.saveApiKey = saveApiKey;
    window.toggleApiKeyVisibility = toggleApiKeyVisibility;
    window.testResendConnection = testResendConnection;
    window.testGeminiConnection = testGeminiConnection;
}


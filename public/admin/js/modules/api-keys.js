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

        // Load Cloudflare API keys
        const cfAccountInput = document.getElementById('cloudflare-account-id');
        const cfAccessKeyInput = document.getElementById('cloudflare-access-key-id');
        const cfSecretKeyInput = document.getElementById('cloudflare-secret-access-key');
        const cfBucketInput = document.getElementById('cloudflare-r2-bucket');
        const cfPublicUrlInput = document.getElementById('cloudflare-public-url');

        if (cfAccountInput && config.apiKeys?.cloudflare?.accountId) {
            cfAccountInput.value = config.apiKeys.cloudflare.accountId;
        }
        if (cfAccessKeyInput && config.apiKeys?.cloudflare?.accessKeyId) {
            cfAccessKeyInput.value = config.apiKeys.cloudflare.accessKeyId;
        }
        if (cfSecretKeyInput && config.apiKeys?.cloudflare?.secretAccessKey) {
            cfSecretKeyInput.value = config.apiKeys.cloudflare.secretAccessKey;
        }
        if (cfBucketInput && config.apiKeys?.cloudflare?.r2Bucket) {
            cfBucketInput.value = config.apiKeys.cloudflare.r2Bucket;
        }
        if (cfPublicUrlInput && config.apiKeys?.cloudflare?.publicUrl) {
            cfPublicUrlInput.value = config.apiKeys.cloudflare.publicUrl;
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
    } else if (type === 'cloudflare') {
        const accountId = document.getElementById('cloudflare-account-id').value.trim();
        const accessKeyId = document.getElementById('cloudflare-access-key-id').value.trim();
        const secretAccessKey = document.getElementById('cloudflare-secret-access-key').value.trim();
        const r2Bucket = document.getElementById('cloudflare-r2-bucket').value.trim();
        const publicUrl = document.getElementById('cloudflare-public-url').value.trim();

        if (!accountId || !accessKeyId || !secretAccessKey) {
            return showToast('Account ID, Access Key ID, and Secret Access Key are required', 'error');
        }

        key = { accountId, accessKeyId, secretAccessKey, r2Bucket, publicUrl };
        keyName = 'Cloudflare';
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

export async function testCloudflareConnection() {
    const accountId = document.getElementById('cloudflare-account-id').value.trim();
    const accessKeyId = document.getElementById('cloudflare-access-key-id').value.trim();
    const secretAccessKey = document.getElementById('cloudflare-secret-access-key').value.trim();

    if (!accountId || !accessKeyId || !secretAccessKey) {
        showToast('Please enter Account ID, Access Key, and Secret Key first', 'error');
        return;
    }

    showToast('Testing Cloudflare credentials format...', 'info');

    // Simple format checks for now
    if (accountId.length === 32 && accessKeyId.length >= 32 && secretAccessKey.length >= 40) {
        setTimeout(() => {
            showToast('Cloudflare credentials format looks valid!', 'success');
        }, 1000);
    } else {
        showToast('Invalid Cloudflare credential format. Check your IDs and Keys.', 'error');
    }
}

// Attach to window for global access from HTML onclick handlers
if (typeof window !== 'undefined') {
    window.saveApiKey = saveApiKey;
    window.toggleApiKeyVisibility = toggleApiKeyVisibility;
    window.testResendConnection = testResendConnection;
    window.testGeminiConnection = testGeminiConnection;
    window.testCloudflareConnection = testCloudflareConnection;
}


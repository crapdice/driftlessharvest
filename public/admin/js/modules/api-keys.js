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

/**
 * Empty stub for backward compatibility with settings.js
 */
export async function loadApiKeys() {
    // Keys are now read-only from .env, no need to load into inputs
}

/**
 * Generic handler for connectivity tests
 */
async function runConnectionTest(provider, btnEl) {
    const statusEl = document.getElementById(`status-${provider}`);
    const spinner = btnEl?.querySelector('.btn-spinner');

    if (statusEl) {
        statusEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600';
        statusEl.textContent = 'Testing...';
    }

    if (spinner) spinner.classList.remove('hidden');
    if (btnEl) btnEl.disabled = true;

    try {
        const response = await fetch(`/api/config/test/${provider}`);
        const data = await response.json();

        if (response.ok && (data.success || data.models || data.bucket)) {
            if (statusEl) {
                if (data.restricted) {
                    statusEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-600';
                    statusEl.textContent = 'Restricted';
                } else {
                    statusEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600';
                    statusEl.textContent = 'Connected';
                }
            }
            const msg = data.restricted
                ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected (with restricted permissions).`
                : `${provider.charAt(0).toUpperCase() + provider.slice(1)} connection successful!`;
            showToast(msg, 'success');
        } else {
            throw new Error(data.error || 'Connection verification failed');
        }
    } catch (error) {
        console.error(`${provider} Test Error:`, error);
        if (statusEl) {
            statusEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-600';
            statusEl.textContent = 'Error';
        }
        showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Connection Failed: ${error.message}`, 'error');
    } finally {
        if (spinner) spinner.classList.add('hidden');
        if (btnEl) btnEl.disabled = false;
    }
}

export async function testResendConnection() {
    const btn = event?.currentTarget;
    await runConnectionTest('resend', btn);
}

export async function testGeminiConnection() {
    const btn = event?.currentTarget;
    await runConnectionTest('gemini', btn);
}

export async function testCloudflareConnection() {
    const btn = event?.currentTarget;
    await runConnectionTest('cloudflare', btn);
}

export async function testStripeConnection() {
    const btn = event?.currentTarget;
    await runConnectionTest('stripe', btn);
}

/**
 * Legacy visibility toggle (unused in new UI but kept for compatibility)
 */
export function toggleApiKeyVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Attach to window for global access from HTML onclick handlers
if (typeof window !== 'undefined') {
    window.toggleApiKeyVisibility = toggleApiKeyVisibility;
    window.testResendConnection = testResendConnection;
    window.testGeminiConnection = testGeminiConnection;
    window.testCloudflareConnection = testCloudflareConnection;
    window.testStripeConnection = testStripeConnection;
}


/**
 * SettingsActions - Registered handlers for settings module.
 * Uses ActionDispatcher event delegation.
 * 
 * @module core/SettingsActions
 */

import { registerActions } from './ActionDispatcher.js';

let registered = false;

/**
 * Register all settings actions.
 */
export function registerSettingsActions() {
    if (registered) return;
    registered = true;

    registerActions('settings', {
        // === Tab Navigation ===
        setTab: (data) => window.setConfigTab?.(data.tab),

        // === Header Actions ===
        toggleAdvanced: () => window.toggleAdvancedConfig?.(),
        restoreDefaults: () => window.restoreDefaults?.(),
        saveConfig: () => window.saveConfigForm?.(),
        saveRawConfig: () => window.saveRawConfig?.(),

        // === Farm Management ===
        addFarm: () => window.addFarm?.(),

        // === API Connection Tests ===
        testGemini: () => window.testGeminiConnection?.(true),
        testCloudflare: () => window.testCloudflareConnection?.(true),
        testStripe: () => window.testStripeConnection?.(true),
        testResend: () => window.testResendConnection?.(true)
    });

    console.log('[SettingsActions] Registered 11 settings actions.');
}

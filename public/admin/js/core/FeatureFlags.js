/**
 * FeatureFlags - Gradual Rollout Control
 * 
 * Allows progressive migration and emergency rollback
 */

export class FeatureFlags {
    constructor() {
        // Load from localStorage or use defaults
        this.flags = this.loadFlags();
    }

    /**
     * Load flags from localStorage with defaults
     */
    loadFlags() {
        const stored = localStorage.getItem('admin_feature_flags');
        const defaults = {
            // Master switch for modern router
            USE_MODERN_ROUTER: true,

            // Emergency rollback - forces all views to legacy mode
            FORCE_LEGACY_MODE: false,

            // Views that have been migrated to modern system
            MIGRATED_VIEWS: ['dashboard'],

            // Enable new modal system
            USE_MODERN_MODALS: true,

            // Enable CAP strategy layer
            USE_CAP_STRATEGY: true,

            // Debug mode - extra logging
            DEBUG_MODE: false
        };

        if (stored) {
            try {
                return { ...defaults, ...JSON.parse(stored) };
            } catch (error) {
                console.error('[FeatureFlags] Failed to parse stored flags:', error);
                return defaults;
            }
        }

        return defaults;
    }

    /**
     * Save flags to localStorage
     */
    saveFlags() {
        localStorage.setItem('admin_feature_flags', JSON.stringify(this.flags));
    }

    /**
     * Check if a feature is enabled
     */
    isEnabled(flagName) {
        return this.flags[flagName] === true;
    }

    /**
     * Enable a feature
     */
    enable(flagName) {
        this.flags[flagName] = true;
        this.saveFlags();
        console.log(`[FeatureFlags] Enabled: ${flagName}`);
    }

    /**
     * Disable a feature
     */
    disable(flagName) {
        this.flags[flagName] = false;
        this.saveFlags();
        console.log(`[FeatureFlags] Disabled: ${flagName}`);
    }

    /**
     * Add a view to migrated list
     */
    migrateView(viewName) {
        if (!this.flags.MIGRATED_VIEWS.includes(viewName)) {
            this.flags.MIGRATED_VIEWS.push(viewName);
            this.saveFlags();
            console.log(`[FeatureFlags] Migrated view: ${viewName}`);
        }
    }

    /**
     * Remove a view from migrated list (rollback)
     */
    rollbackView(viewName) {
        const index = this.flags.MIGRATED_VIEWS.indexOf(viewName);
        if (index > -1) {
            this.flags.MIGRATED_VIEWS.splice(index, 1);
            this.saveFlags();
            console.log(`[FeatureFlags] Rolled back view: ${viewName}`);
        }
    }

    /**
     * Get all migrated views
     */
    getMigratedViews() {
        return this.flags.MIGRATED_VIEWS || [];
    }

    /**
     * Emergency: Force all views to legacy mode
     */
    emergencyRollback() {
        this.flags.FORCE_LEGACY_MODE = true;
        this.saveFlags();
        console.warn('[FeatureFlags] EMERGENCY ROLLBACK ACTIVATED');

        // Show alert to user
        if (window.showToast) {
            window.showToast('System rolled back to legacy mode', 'warning');
        }
    }

    /**
     * Clear emergency rollback
     */
    clearEmergencyRollback() {
        this.flags.FORCE_LEGACY_MODE = false;
        this.saveFlags();
        console.log('[FeatureFlags] Emergency rollback cleared');
    }

    /**
     * Get all flags (for debugging)
     */
    getAll() {
        return { ...this.flags };
    }

    /**
     * Reset to defaults
     */
    reset() {
        localStorage.removeItem('admin_feature_flags');
        this.flags = this.loadFlags();
        console.log('[FeatureFlags] Reset to defaults');
    }
}

// Singleton instance
export const featureFlags = new FeatureFlags();

// Make globally available
window.FeatureFlags = FeatureFlags;
window.featureFlags = featureFlags;

// Debug helper
if (featureFlags.isEnabled('DEBUG_MODE')) {
    console.log('[FeatureFlags] Current flags:', featureFlags.getAll());
}

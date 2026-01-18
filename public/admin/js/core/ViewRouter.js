/**
 * ViewRouter - Strangler Fig Pattern Implementation
 * 
 * Dual-mode router that supports both legacy embedded views and modern external views.
 * This allows progressive migration without breaking existing functionality.
 */

export class ViewRouter {
    constructor(options = {}) {
        // Views that have been migrated to external files
        this.modernViews = new Set(options.modernViews || []);

        // Views still embedded in index.html (legacy)
        this.legacyViews = new Set(options.legacyViews || []);

        // Currently active view
        this.currentView = null;

        // View cache to avoid re-fetching
        this.viewCache = new Map();

        // Feature flags
        this.featureFlags = options.featureFlags || {};

        // Lifecycle hooks
        this.onBeforeLoad = options.onBeforeLoad || (() => { });
        this.onAfterLoad = options.onAfterLoad || (() => { });
        this.onError = options.onError || ((error) => console.error('[ViewRouter]', error));

        this.init();
    }

    init() {
        console.log('[ViewRouter] Initialized', {
            modern: Array.from(this.modernViews),
            legacy: Array.from(this.legacyViews)
        });
    }

    /**
     * Load a view by name
     * Automatically routes to modern or legacy system
     */
    async loadView(viewName) {
        try {
            // Emergency rollback - force legacy mode
            if (this.featureFlags.FORCE_LEGACY_MODE) {
                return await this.loadLegacyView(viewName);
            }

            // Check if view has been migrated
            if (this.modernViews.has(viewName)) {
                return await this.loadModernView(viewName);
            } else if (this.legacyViews.has(viewName)) {
                return await this.loadLegacyView(viewName);
            } else {
                // Try modern first, fallback to legacy
                try {
                    return await this.loadModernView(viewName);
                } catch (error) {
                    console.warn(`[ViewRouter] Modern view '${viewName}' not found, trying legacy...`);
                    return await this.loadLegacyView(viewName);
                }
            }
        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Load modern view from external file
     */
    async loadModernView(viewName) {
        console.log(`[ViewRouter] Loading modern view: ${viewName}`);

        await this.onBeforeLoad(viewName, 'modern');

        // Hide all views
        this.hideAllViews();

        // Check cache first
        let viewContainer = this.viewCache.get(viewName);

        if (!viewContainer) {
            // Create new container
            viewContainer = document.createElement('div');
            viewContainer.id = `view-${viewName}`;
            viewContainer.className = 'view-container';

            // Fetch view HTML
            const response = await fetch(`/admin/views/${viewName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load view: ${viewName} (${response.status})`);
            }

            const html = await response.text();
            viewContainer.innerHTML = html;

            // Append to main container
            const mainContainer = document.querySelector('main');
            mainContainer.appendChild(viewContainer);

            // Cache it
            this.viewCache.set(viewName, viewContainer);

            // Initialize view-specific module if it exists
            await this.initializeViewModule(viewName);
        }

        // Show the view
        viewContainer.classList.remove('hidden');
        this.currentView = viewName;

        await this.onAfterLoad(viewName, 'modern');

        console.log(`[ViewRouter] Modern view loaded: ${viewName}`);
    }

    /**
     * Load legacy view from embedded HTML
     */
    async loadLegacyView(viewName) {
        console.log(`[ViewRouter] Loading legacy view: ${viewName}`);

        await this.onBeforeLoad(viewName, 'legacy');

        // Hide all views
        this.hideAllViews();

        // Show the embedded view
        const viewElement = document.getElementById(`view-${viewName}`);
        if (!viewElement) {
            throw new Error(`Legacy view not found: ${viewName}`);
        }

        viewElement.classList.remove('hidden');
        this.currentView = viewName;

        // Call legacy initialization function if it exists
        const initFn = window[`load${this.capitalize(viewName)}`];
        if (typeof initFn === 'function') {
            await initFn();
        }

        await this.onAfterLoad(viewName, 'legacy');

        console.log(`[ViewRouter] Legacy view loaded: ${viewName}`);
    }

    /**
     * Initialize view-specific JavaScript module
     */
    async initializeViewModule(viewName) {
        try {
            // Try to import the module (use absolute path from /admin/js/)
            const module = await import(`../modules/${viewName}.js`);

            // Call init function if it exists
            if (module.init && typeof module.init === 'function') {
                await module.init();
            }

            // Call load function if it exists (legacy compatibility)
            const loadFn = module[`load${this.capitalize(viewName)}`];
            if (loadFn && typeof loadFn === 'function') {
                await loadFn();
            }

            console.log(`[ViewRouter] Module initialized: ${viewName}`);
        } catch (error) {
            // Module doesn't exist or failed to load - that's okay
            console.log(`[ViewRouter] No module for view: ${viewName}`, error);
        }
    }

    /**
     * Hide all views (both modern and legacy)
     */
    hideAllViews() {
        // Hide all elements with view- prefix
        document.querySelectorAll('[id^="view-"]').forEach(view => {
            view.classList.add('hidden');
        });
    }

    /**
     * Migrate a view from legacy to modern
     */
    migrateView(viewName) {
        this.legacyViews.delete(viewName);
        this.modernViews.add(viewName);
        console.log(`[ViewRouter] Migrated view: ${viewName}`);
    }

    /**
     * Get migration status
     */
    getStatus() {
        const total = this.modernViews.size + this.legacyViews.size;
        const migrated = this.modernViews.size;
        const percentage = total > 0 ? Math.round((migrated / total) * 100) : 0;

        return {
            total,
            migrated,
            remaining: this.legacyViews.size,
            percentage,
            modernViews: Array.from(this.modernViews),
            legacyViews: Array.from(this.legacyViews)
        };
    }

    /**
     * Utility: Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Make globally available for legacy code
window.ViewRouter = ViewRouter;

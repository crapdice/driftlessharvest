/**
 * Main Admin Initialization Script
 * 
 * Wires together the ViewRouter with existing modules using Strangler Fig pattern
 */

import { ViewRouter } from './core/ViewRouter.js';
import { featureFlags } from './core/FeatureFlags.js';
import { dataStrategy } from './core/DataStrategy.js';

// Initialize ViewRouter with current migration status
const router = new ViewRouter({
    modernViews: new Set(featureFlags.getMigratedViews()),
    legacyViews: new Set([
        'orders', 'customers', 'delivery', 'inventory',
        'products', 'templates', 'categories', 'archived',
        'users', 'settings', 'analytics', 'api-keys',
        'utilities', 'layouts'
    ]),
    featureFlags: featureFlags.getAll(),
    onBeforeLoad: (viewName, mode) => {
        console.log(`[Main] Loading ${viewName} (${mode} mode)`);
        updateActiveNav(viewName);
    },
    onAfterLoad: (viewName, mode) => {
        console.log(`[Main] Loaded ${viewName} (${mode} mode)`);
    },
    onError: (error) => {
        console.error('[Main] Router error:', error);
        if (window.showToast) {
            window.showToast('Failed to load view', 'error');
        }
    }
});

/**
 * Global setTab function (replaces legacy implementation)
 */
window.setTab = async function (viewName) {
    try {
        await router.loadView(viewName);
    } catch (error) {
        console.error('[Main] Failed to load view:', viewName, error);
    }
};

/**
 * Update active navigation item
 */
function updateActiveNav(viewName) {
    // Remove active class from all nav items
    document.querySelectorAll('[id^="nav-"]').forEach(nav => {
        nav.classList.remove('bg-blue-50', 'text-blue-600', 'font-semibold');
        nav.classList.add('text-gray-600');
    });

    // Add active class to current nav item
    const activeNav = document.getElementById(`nav-${viewName}`);
    if (activeNav) {
        activeNav.classList.add('bg-blue-50', 'text-blue-600', 'font-semibold');
        activeNav.classList.remove('text-gray-600');
    }
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Main] Admin panel initializing...');

    // Log migration status
    const status = router.getStatus();
    console.log('[Main] Migration status:', status);

    // Load default view (dashboard)
    await router.loadView('dashboard');

    console.log('[Main] Admin panel ready!');
});

// Make router globally available for debugging
window.adminRouter = router;
window.featureFlags = featureFlags;
window.dataStrategy = dataStrategy;

// Debug helper
if (featureFlags.isEnabled('DEBUG_MODE')) {
    console.log('[Main] Debug mode enabled');
    console.log('[Main] Migration status:', router.getStatus());
}

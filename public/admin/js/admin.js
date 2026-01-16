/**
 * Admin Panel Core Module
 * Handles view loading, routing, and initialization
 */

// Global state
window.currentView = null;
window.viewCache = {};

/**
 * Load a view from the views directory
 * @param {string} viewName - Name of the view file (without .html)
 */
async function loadView(viewName) {
    const container = document.getElementById('view-container');

    if (!container) {
        console.error('[Admin] View container not found');
        return;
    }

    // Show loading state
    container.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-gray-400">Loading...</div></div>';

    try {
        // Check cache first
        if (window.viewCache[viewName]) {
            container.innerHTML = window.viewCache[viewName];
            window.currentView = viewName;
            await initializeViewScripts(viewName);
            return;
        }

        // Fetch view HTML
        const response = await fetch(`/admin/views/${viewName}.html`);

        if (!response.ok) {
            throw new Error(`Failed to load view: ${viewName}`);
        }

        const html = await response.text();

        // Cache the view
        window.viewCache[viewName] = html;

        // Inject into container
        container.innerHTML = html;
        window.currentView = viewName;

        // Initialize view-specific scripts
        await initializeViewScripts(viewName);

    } catch (error) {
        console.error('[Admin] Error loading view:', error);
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <div class="text-red-500 text-lg font-semibold mb-2">Failed to load view</div>
                <div class="text-gray-500 text-sm">${error.message}</div>
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Reload Page
                </button>
            </div>
        `;
    }
}

/**
 * Initialize view-specific JavaScript modules
 * @param {string} viewName - Name of the view
 */
async function initializeViewScripts(viewName) {
    // Map view names to their initialization functions
    const viewInitializers = {
        'dashboard': () => {
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            if (typeof loadActiveCarts === 'function') loadActiveCarts();
        },
        'orders': () => {
            if (typeof loadOrders === 'function') loadOrders();
        },
        'customers': () => {
            if (typeof loadCustomers === 'function') loadCustomers();
        },
        'inventory': () => {
            if (typeof loadInventory === 'function') loadInventory();
        },
        'products': () => {
            if (typeof loadProducts === 'function') loadProducts();
        },
        'templates': () => {
            if (typeof loadBoxTemplates === 'function') loadBoxTemplates();
        },
        'categories': () => {
            if (typeof loadCategories === 'function') loadCategories();
        },
        'archived': () => {
            if (typeof loadArchivedProducts === 'function') loadArchivedProducts();
        },
        'delivery': () => {
            if (typeof loadDeliveryWindows === 'function') loadDeliveryWindows();
        },
        'users': () => {
            if (typeof loadUsers === 'function') loadUsers();
        },
        'settings': () => {
            if (typeof loadConfig === 'function') loadConfig();
        },
        'utilities': () => {
            if (typeof loadUtilities === 'function') loadUtilities();
        },
        'layouts': () => {
            if (typeof loadLayouts === 'function') loadLayouts();
        },
        'analytics': () => {
            if (typeof loadAnalytics === 'function') loadAnalytics();
        }
    };

    // Call the initializer if it exists
    const initializer = viewInitializers[viewName];
    if (initializer) {
        try {
            await initializer();
        } catch (error) {
            console.error(`[Admin] Error initializing ${viewName}:`, error);
        }
    }
}

/**
 * Set active tab and load corresponding view
 * @param {string} tabName - Name of the tab/view to activate
 */
async function setTab(tabName) {
    // Update URL hash
    window.location.hash = tabName;

    // Update sidebar active state
    document.querySelectorAll('[id^="nav-"]').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600', 'font-semibold');
        btn.classList.add('text-gray-600');
    });

    const activeBtn = document.getElementById(`nav-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600');
        activeBtn.classList.add('bg-blue-50', 'text-blue-600', 'font-semibold');
    }

    // Load the view
    await loadView(tabName);
}

/**
 * Initialize admin panel on page load
 */
async function initializeAdmin() {
    console.log('[Admin] Initializing modular admin panel...');

    // Check authentication
    const token = localStorage.getItem('harvest_token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Load user info
    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }

        const user = await response.json();

        // Update header
        const headerInfo = document.getElementById('header-user-info');
        if (headerInfo) {
            headerInfo.classList.remove('hidden');
            headerInfo.classList.add('flex');
            document.getElementById('header-user-email').textContent = user.email;
            document.getElementById('header-user-role').textContent = user.admin_type || 'Admin';
        }

        // Enable/disable super admin features
        if (user.admin_type === 'super_admin') {
            document.querySelectorAll('#nav-utilities, #nav-layouts').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('text-gray-400', 'hover:bg-transparent', 'cursor-not-allowed');
                btn.classList.add('text-gray-600', 'hover:bg-gray-50', 'cursor-pointer');
                btn.removeAttribute('title');
            });
        }

    } catch (error) {
        console.error('[Admin] Auth check failed:', error);
        localStorage.removeItem('harvest_token');
        window.location.href = '/';
        return;
    }

    // Load initial view from hash or default to dashboard
    const initialView = window.location.hash.slice(1) || 'dashboard';
    await setTab(initialView);

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        const view = window.location.hash.slice(1) || 'dashboard';
        setTab(view);
    });

    console.log('[Admin] Initialization complete');
}

/**
 * Logout function
 */
function logout() {
    localStorage.removeItem('harvest_token');
    localStorage.removeItem('harvest_user');
    window.location.href = '/';
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}

// Export functions to window for inline onclick handlers
window.setTab = setTab;
window.logout = logout;

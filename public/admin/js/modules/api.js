/**
 * Admin API Client
 */
import { showToast } from './utils.js';

// Show login modal if 401/403 (Assuming this function is globally available or we event bus it)
// For now, we'll export a setup function to link the UI handler
let loginHandler = () => window.location.reload();

export function setLoginHandler(handler) {
    loginHandler = handler;
}

function getHeaders() {
    // Token now in HttpOnly cookie - just send Content-Type
    return {
        'Content-Type': 'application/json'
    };
}

export async function request(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: getHeaders(),
            credentials: 'include', // CRITICAL: sends HttpOnly cookie
            cache: 'no-store'
        };
        if (body) options.body = JSON.stringify(body);

        const url = endpoint.startsWith('/api') ? endpoint : `/api/admin${endpoint}`;
        const res = await fetch(url, options);

        if (res.status === 401) {
            loginHandler();
            const text = await res.text();
            console.error(`API Error (${endpoint}):`, res.status, text);
            throw new Error(`Unauthorized: ${res.status} ${text}`);
        }

        if (res.status === 403) {
            // Force re-login on permission denied to allow switching accounts
            console.warn('403 Forbidden - Insufficient Permissions. Forcing re-login.');
            // Cookie cleared via API logout, no localStorage to remove
            loginHandler(); // Trigger reload/login flow
            throw new Error('Permission denied');
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Request failed');
        }

        if (res.status === 204) return null;
        return await res.json();
    } catch (err) {
        // If it's simply unauthorized, the handler triggered.
        // If it's a real error, rethrow so caller can handle UI
        throw err;
    }
}

export const api = {
    getStats: () => request('/stats'),

    // Users
    getUsers: () => request('/users'),
    createUser: (data) => request('/users', 'POST', data),
    updateUser: (id, data) => request(`/users/${id}`, 'PUT', data),
    deleteUser: (id) => request(`/users/${id}`, 'DELETE'),
    resetPassword: (id) => request(`/users/${id}/reset`, 'POST'),

    // Orders
    getOrders: () => request('/orders'),
    updateOrderStatus: (id, status) => request(`/orders/${id}/status`, 'PUT', { status }),
    updateOrderDelivery: (id, window) => request(`/orders/${id}/delivery`, 'PUT', { delivery_window: window }),
    updateOrderDetails: (id, data) => request(`/orders/${id}`, 'PUT', data),

    // Active Carts
    getActiveCarts: () => request('/active-carts'),

    // Payments
    syncPayment: (orderId) => request(`/sync-payment/${orderId}`, 'POST'),

    // Delivery
    getDeliverySchedule: () => request('/delivery-schedule'),
    getDeliveryWindows: () => request('/delivery-windows'),
    createDeliveryWindow: (data) => request('/delivery-windows', 'POST', data),
    updateDeliveryWindow: (id, isActive) => request(`/delivery-windows/${id}`, 'PUT', { is_active: isActive }),
    deleteDeliveryWindow: (id) => request(`/delivery-windows/${id}`, 'DELETE'),

    // Products & Inventory
    getProducts: () => request('/products'),
    getArchivedProducts: () => request('/products/archived'),
    getProduct: (id) => request(`/products/${id}`),
    createProduct: (data) => request('/products', 'POST', data),
    updateProduct: (id, data) => request(`/products/${id}`, 'PUT', data),
    deleteProduct: (id) => request(`/products/${id}`, 'DELETE'),

    // Box Templates
    getBoxTemplates: () => request('/box-templates'),
    createBoxTemplate: (data) => request('/box-templates', 'POST', data),
    updateBoxTemplate: (id, data) => request(`/box-templates/${id}`, 'PUT', data),
    deleteBoxTemplate: (id) => request(`/box-templates/${id}`, 'DELETE'),

    // Config (note: uses /api/config not /api/admin/config)
    getConfig: async () => {
        const res = await fetch('/api/config', {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to load config');
        return res.json();
    },
    updateConfig: async (data) => {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to save config');
        return res.json();
    },

    // Gemini
    testGemini: async () => {
        const res = await fetch('/api/gemini/test', {
            method: 'POST',
            credentials: 'include'
        });
        return res.json();
    },

    // Product Restore/Permanent Delete
    restoreProduct: (id) => request(`/products/${id}/restore`, 'POST'),
    permanentDeleteProduct: (id) => request(`/products/${id}/permanent`, 'DELETE'),

    // Categories (uses /api/categories not /api/admin/categories)
    getCategories: async () => {
        const res = await fetch('/api/categories', {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to load categories');
        return res.json();
    },
    createCategory: async (name) => {
        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Failed to create category');
        return res.json();
    },
    deleteCategory: async (id) => {
        const res = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to delete category');
        return res.json();
    },

    // Analytics
    getAnalyticsOverview: (days = 30) => request(`/analytics/overview?days=${days}`),
    getRecentVisitors: () => request('/analytics/recent-visitors'),

    // Config Restore
    restoreConfig: async () => {
        const res = await fetch('/api/config/restore', {
            method: 'POST',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to restore config');
        return res.json();
    },

    // Utilities
    cleanDatabase: () => request('/utilities/clean-database', 'POST'),
    cleanOrders: () => request('/utilities/clean-orders', 'POST'),
    cleanUsers: () => request('/utilities/clean-users', 'POST'),
    cleanAnalytics: () => request('/utilities/clean-analytics', 'POST'),
    cleanDeliveryWindows: () => request('/utilities/clean-delivery-windows', 'POST'),
    seedUsers: () => request('/utilities/seed-users', 'POST'),
    seedOrders: () => request('/utilities/seed-orders', 'POST'),
    verifyDatabase: () => request('/utilities/verify-database'),
    cleanTempFiles: () => request('/utilities/clean-temp-files', 'POST'),
    queryTable: (tableName) => request(`/utilities/query/${tableName}`),

    // Auth & Profile
    getProfile: () => request('/api/user/profile'),
    login: (credentials) => fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
    }).then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Login failed');
        return data;
    }),
    logout: () => fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
};


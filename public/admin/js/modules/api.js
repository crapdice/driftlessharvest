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
    const token = localStorage.getItem('harvest_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function request(endpoint, method = 'GET', body = null) {
    try {
        const options = { method, headers: getHeaders(), cache: 'no-store' };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`/api/admin${endpoint}`, options);

        if (res.status === 401) {
            loginHandler();
            if (!res.ok) {
                const text = await res.text();
                console.error(`API Error (${endpoint}):`, res.status, text);
                throw new Error(`Request failed: ${res.status} ${text}`);
            }
        }

        if (res.status === 403) {
            // Force re-login on permission denied to allow switching accounts
            console.warn('403 Forbidden - Insufficient Permissions. Forcing re-login.');
            localStorage.removeItem('harvest_token'); // Ensure token is gone
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
};

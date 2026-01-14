
const API_BASE = '/api';

/**
 * Generic Fetch Wrapper
 */
async function sendRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('harvest_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const res = await fetch(url, options);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${res.status}`);
    }

    // Return null for 204 No Content
    if (res.status === 204) return null;

    return res.json();
}

// Config
export function fetchConfig() {
    return sendRequest('/config');
}

// Auth
export function loginUser(email, password) {
    return sendRequest('/auth/login', 'POST', { email, password });
}

export function signupUser(email, password) {
    return sendRequest('/auth/signup', 'POST', { email, password });
}

// Products
export function fetchProducts() {
    return sendRequest('/products');
}

export function fetchBoxTemplates() {
    return sendRequest('/box-templates');
}

export function fetchDeliveryWindows() {
    return sendRequest('/delivery-windows');
}

// Cart / Inventory
// Cart / Inventory
export function checkStock(productId, qty) {
    return sendRequest('/cart/check-stock', 'POST', { productId, qty });
}

export function checkTemplateStock(templateId) {
    return sendRequest('/cart/check-template-stock', 'POST', { templateId });
}

export function syncCart(items, guestId) {
    return sendRequest('/cart/sync', 'POST', { items, guestId });
}

// Deprecated / No-op endpoints (kept if needed for legacy compatibility, but better removed if unused)
export function releaseStock(productId, qty) {
    return sendRequest('/cart/release', 'POST', { productId, qty });
}

// Orders
// Orders & Checkout
export function createPaymentIntent(items, userEmail) {
    return sendRequest('/create-payment-intent', 'POST', { items, userEmail });
}

export function updateOrderDetails(orderId, shipping, deliveryWindow, email) {
    return sendRequest('/orders/update-details', 'POST', {
        orderId, shipping, delivery_window: deliveryWindow, email
    });
}

export function verifyPayment(orderId) {
    return sendRequest(`/orders/${orderId}/verify-payment`, 'POST');
}

export function placeOrder(orderData) {
    return sendRequest('/orders', 'POST', orderData);
}

export function fetchMyOrders() {
    return sendRequest('/orders/mine');
}

// User Profile
export function fetchProfile() {
    return sendRequest('/user/profile');
}

export function updateProfile(data) {
    return sendRequest('/user/profile', 'PUT', data);
}

// Analytics
export function logExposure(payload) {
    return sendRequest('/ab-exposure', 'POST', payload).catch(e => console.error("Exposure log failed", e));
}

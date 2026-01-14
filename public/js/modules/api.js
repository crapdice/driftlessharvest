
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

    const res = await fetch(`${API_BASE}${endpoint}`, options);
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

// Cart / Inventory
export function reserveStock(productId, qty) {
    return sendRequest('/cart/reserve', 'POST', { productId, qty });
}

export function releaseStock(productId, qty) {
    return sendRequest('/cart/release', 'POST', { productId, qty });
}

export function reserveTemplate(templateId) {
    return sendRequest('/cart/reserve-template', 'POST', { templateId });
}

export function releaseTemplate(templateId, qty) {
    return sendRequest('/cart/release-template', 'POST', { templateId, qty });
}

// Orders
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

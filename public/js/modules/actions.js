
import { store } from '../store/index.js';
import * as api from './api.js';
import { setView, router as render } from './router.js';
import { renderHeaderCount } from '../views/layout.js';
import { showToast } from '../utils.js';

// Import delegations
import * as Auth from './auth.js';
import * as Cart from './cart.js';
import * as Products from './products.js';
import * as Checkout from './checkout.js';
import * as Profile from './profile_v2.js';

// Re-export specific actions for UI binding
export const login = Auth.login;
export const signup = Auth.signup;
export const logout = Auth.logout;

export const loadCart = Cart.loadCart;
export const saveCart = Cart.saveCart;
export const addToCart = Cart.addToCart;
export const addTemplateToCart = Cart.addTemplateToCart;
export const removeFromCart = Cart.removeFromCart;
export const updateProductQty = Cart.updateProductQty;
export const updateCartUI = Cart.updateCartUI;

export const loadMarketplace = Products.loadMarketplace;
export const loadFeaturedProducts = Products.loadFeaturedProducts;

export const initCheckout = Checkout.initCheckout;
export const placeOrder = Checkout.placeOrder;

// ------------------------------------------------------------------
// INIT
// ------------------------------------------------------------------
export async function initApp() {
    try {
        const config = await api.fetchConfig();
        window.CONFIG = config;
        store.setConfig(config);

        // Session restored by Store constructor


        // Restore Cart
        Cart.loadCart();

        // Check for login redirect from admin
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'login') {
            setView('login'); // This sets state.view via router?
            // Router might rely on state.view. Checking router next...
        }

        // Apply Theme
        if (window.CONFIG.theme?.colors) {
            const root = document.documentElement;
            Object.entries(window.CONFIG.theme.colors).forEach(([key, val]) => {
                root.style.setProperty(`--color-${key}`, val);
            });
        }

        startApp();
    } catch (err) {
        console.error(err);
        document.body.innerHTML = '<div class="p-10 text-red-600">Failed to load application configuration.</div>';
    }
}

export function startApp() {
    render(); // Render based on current URL
}

// ------------------------------------------------------------------
// GLOBAL ACTIONS (Misc)
// ------------------------------------------------------------------

window.verifyOrderPayment = async function (orderId) {
    const btn = event.target;
    if (!btn) return;

    const originalText = btn.innerText;
    btn.innerText = 'Checking...';
    btn.disabled = true;

    try {
        const res = await api.verifyPayment(orderId);

        // API wrapper returns JSON or throws.
        // But verifyPayment endpoint returns { success: true/false, status: 'Paid' } or similar?
        // Let's assume standard response handled by api.js
        // api.js throws on !res.ok.
        // verifyPayment returns res.json().

        const data = res; // api.js returns parsed JSON

        if (data.success && data.status === 'Paid') {
            showToast('Payment confirmed! Updating status...');
            Profile.loadUserOrders();
        } else {
            showToast(data.msg || 'Payment not yet confirmed', 'info');
            btn.innerText = 'Check Again';
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        showToast('Verification failed to connect', 'error');
        btn.innerText = originalText;
        btn.disabled = false;
    }
};


export const loadUserProfile = Profile.loadUserProfile;
export const updateProfile = Profile.updateProfile;
export const handlePhoneInput = Profile.handlePhoneInput;
export const validateInput = Profile.validateInput;
export const loadUserOrders = Profile.loadUserOrders;

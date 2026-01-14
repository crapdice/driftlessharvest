import { state } from './state.js';
import { router as render, setView } from './router.js';
import { loadCart } from './cart.js';

export async function initApp() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to load config');
        window.CONFIG = await response.json();

        // Check for existing token
        try {
            const token = localStorage.getItem('harvest_token');
            const savedUser = localStorage.getItem('harvest_user');
            if (token && savedUser) {
                state.user = JSON.parse(savedUser);
            }
        } catch (e) {
            console.warn("Failed to restore user session", e);
            localStorage.removeItem('harvest_token');
            localStorage.removeItem('harvest_user');
        }

        try {
            loadCart();
        } catch (e) {
            console.warn("Failed to load cart", e);
            localStorage.removeItem('harvest_cart');
        }

        // Check for login redirect from admin
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'login') {
            state.view = 'login';
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

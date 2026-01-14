
import { state } from './state.js';
import * as Views from '../views/index.js'; // We will create this index file next

import { renderHeader, renderFooter } from '../views/layout.js';

const ROUTES = {
    '/': 'renderHome',
    '/how': 'renderHow',
    '/farms': 'renderFarms',
    '/boxes': 'renderBoxes',
    '/login': 'renderLogin',
    '/signup': 'renderSignup',
    '/dashboard': 'renderDashboard',
    '/cart': 'renderCart',
    '/checkout': 'renderCheckout',
    '/wizard': 'renderWizard'
};

const SCROLL_KEY_PREFIX = 'harvest_scroll_';

// Save scroll on the CURRENT path
function saveCurrentScroll() {
    const path = window.location.pathname;
    sessionStorage.setItem(`${SCROLL_KEY_PREFIX}${path}`, window.scrollY);
}

// Global scroll listener
window.addEventListener('scroll', () => {
    // Simple throttle could be added here if performance suffers, 
    // but essential for capturing the exact spot before unload/refresh.
    saveCurrentScroll();
}, { passive: true });

export function setView(viewName) {
    const map = {
        'home': '/',
        'boxes': '/boxes',
        'how': '/how',
        'farms': '/farms',
        'login': '/login',
        'signup': '/signup',
        'dashboard': '/dashboard',
        'cart': '/cart',
        'checkout': '/checkout',
        'wizard': '/wizard'
    };
    navigateTo(map[viewName] || '/');
}

export function navigateTo(url) {
    // 1. Save position of the page we are LEAVING
    saveCurrentScroll();

    // 2. Clear saved position for the page we are GOING TO (Reset to top for fresh nav)
    // Exception: If we wanted to "remember where I left off" even after navigating away, 
    // we would skip this. But standard web behavior is Top on fresh link click.
    sessionStorage.removeItem(`${SCROLL_KEY_PREFIX}${url}`);

    history.pushState(null, null, url);
    router();
}

export function router(preserveScroll = false) {
    const path = window.location.pathname;

    // Fallback to home
    const viewKey = ROUTES[path] || 'renderHome';
    const viewFn = Views[viewKey] || Views.renderHome;

    const globalPadding = (path === '/boxes') ? 'pt-[72px]' : '';

    // Render Layout
    const appHeader = document.getElementById('app-header');
    if (appHeader) {
        appHeader.innerHTML = renderHeader();
    }

    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = `
          <div class="${globalPadding} min-h-screen">
            ${viewFn()}
          </div>
          ${renderFooter()} 
      `;
    }

    if (!preserveScroll) {
        // Attempt to restore
        const saved = sessionStorage.getItem(`${SCROLL_KEY_PREFIX}${path}`);
        if (saved !== null) {
            // Restore (Refresh / Back Button / Async Update)
            window.scrollTo(0, parseInt(saved, 10));
        } else {
            // Fresh Navigation
            window.scrollTo(0, 0);
        }
    }

    // Post-render hooks
    if (path === '/') {
        setTimeout(() => {
            if (typeof window.loadFeaturedProducts === 'function') {
                window.loadFeaturedProducts();
            }
        }, 0);
    }

    // Phase 2.5: Attach Phone Formatter for Checkout
    if (path === '/checkout') {
        const phoneInput = document.getElementById('checkout-phone');
        if (phoneInput && window.formatPhoneNumber) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = window.formatPhoneNumber(e.target.value);
            });
        }

        // Phase 2.6: Force Uppercase for State
        const stateInput = document.getElementById('checkout-state');
        if (stateInput) {
            stateInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        // Stripe Init
        if (typeof window.initCheckout === 'function') {
            window.initCheckout();
        }
    }
}

// Initialize history listener
window.onpopstate = () => router();

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', e => {
        if (e.target.matches('[href]')) {
            e.preventDefault();
            navigateTo(e.target.getAttribute('href'));
        }
    });
});

export function navigateToSection(id) {
    const isHome = window.location.pathname === '/';

    if (!isHome) {
        navigateTo('/');
        // Wait for router render (tick)
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
}

import { setLoginHandler } from './api.js';
import { loadDashboard, stopPolling } from './dashboard.js';
import { loadOrders } from './orders.js';
import { loadProducts, loadInventory, loadArchivedProducts, saveProduct, openProductModal, openTemplateModal, startProductPolling, stopProductPolling, initArchived } from './products.js';
import { loadUsers, saveUser, openUserModal, initUsers } from './users.js';
import { loadDelivery, addDeliveryWindow } from './delivery.js';
import { loadSettings, saveSettings, restoreDefaults, initSettings } from './settings.js';
import {
    initLayouts, saveLayout, toggleLayoutItem,
    handleDragStart, handleDragOver, handleDrop,
    openComponentModal, closeComponentModal, setCompTab, saveComponentContent,
    undoLayout, redoLayout
} from './layouts.js';
import { initUtilities } from './utilities.js';
import { initCategories } from './categories.js';
import { initApiKeys } from './api-keys.js';
import { initAnalytics } from './analytics.js';

// State
let currentTab = 'dashboard';

// Global Exports (Immediate Scope)
window.setTab = setTab;
window.saveProduct = saveProduct;
window.openProductModal = openProductModal;
window.editTemplate = window.editTemplate || function () { }; // Handled in products.js but ensuring stub
window.saveUser = saveUser;
window.openUserModal = openUserModal;
window.addDeliveryWindow = addDeliveryWindow;
window.saveSettings = saveSettings;
window.restoreDefaults = restoreDefaults;
window.showLoginModal = showLoginModal;
window.handleLogin = handleLogin;

// Layouts Global Exports
window.saveLayout = saveLayout;
window.toggleLayoutItem = toggleLayoutItem;
window.handleDragStart = handleDragStart;
window.handleDragOver = handleDragOver;
window.handleDrop = handleDrop;
window.openComponentModal = openComponentModal;
window.closeComponentModal = closeComponentModal;
window.setCompTab = setCompTab;
window.saveComponentContent = saveComponentContent;
window.undoLayout = undoLayout;
window.redoLayout = redoLayout;


// Init
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initMobileMenu();
    initTheme();
    startProductPolling(); // Start polling for global alerts (inventory)


    // Check URL hash for direct tab navigation
    const hash = window.location.hash.slice(1);
    if (hash) currentTab = hash;

    setTab(currentTab);
});

function initAuth() {
    setLoginHandler(showLoginModal);
    const token = localStorage.getItem('harvest_token');
    if (!token) {
        window.location.href = '/login.html';
    } else {
        renderHeaderUser();
    }
}

function renderHeaderUser() {
    const userStr = localStorage.getItem('harvest_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const userContainer = document.getElementById('header-user-info');
            const emailEl = document.getElementById('header-user-email');
            const roleEl = document.getElementById('header-user-role');

            if (userContainer) userContainer.classList.remove('hidden');
            if (userContainer) userContainer.classList.add('flex');
            if (emailEl) emailEl.textContent = user.email;
            if (roleEl) {
                roleEl.textContent = user.role;
                // Color code role
                if (user.role === 'super_admin') roleEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30';
                else if (user.role === 'admin') roleEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                else roleEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-700 text-gray-400';
            }

            // Enable super_admin-only features
            initRoleBasedUI(user.role);
        } catch (e) {
            console.error("Failed to parse user info", e);
        }
    }
}

function initRoleBasedUI(role) {
    // Enable utilities and layouts for super_admin only
    if (role === 'super_admin') {
        const utilitiesBtn = document.getElementById('nav-utilities');
        const layoutsBtn = document.getElementById('nav-layouts');

        if (utilitiesBtn) {
            utilitiesBtn.disabled = false;
            utilitiesBtn.classList.remove('text-gray-400', 'hover:bg-transparent', 'cursor-not-allowed');
            utilitiesBtn.classList.add('text-gray-600', 'hover:bg-gray-50');
            utilitiesBtn.removeAttribute('title');
        }

        if (layoutsBtn) {
            layoutsBtn.disabled = false;
            layoutsBtn.classList.remove('text-gray-400', 'hover:bg-transparent', 'cursor-not-allowed');
            layoutsBtn.classList.add('text-gray-600', 'hover:bg-gray-50');
            layoutsBtn.removeAttribute('title');
        }
    }
}

function initTheme() {
    // Force light mode on init just in case
    document.documentElement.classList.remove('dark');
}

// toggleDarkMode removed
// updateThemeIcon removed


function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('aside');
    if (btn && sidebar) {
        btn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebar.classList.toggle('absolute');
            sidebar.classList.toggle('z-50');
            sidebar.classList.toggle('h-full');
        });
    }
}

function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'flex';
}

async function handleLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pwd = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pwd })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('harvest_token', data.token);
            localStorage.setItem('harvest_user', JSON.stringify(data.user)); // Store User Info
            document.getElementById('login-modal').style.display = 'none';
            renderHeaderUser(); // Update UI
            setTab(currentTab);
        } else {
            alert("Login Failed: " + (data.error || "Unknown"));
        }
    } catch (e) {
        console.error(e);
        alert("Error logging in");
    }
}

window.logout = () => {
    localStorage.removeItem('harvest_token');
    localStorage.removeItem('harvest_user');
    window.location.reload();
};

function setTab(tabName) {
    // Check role-based access for super_admin-only tabs
    const userStr = localStorage.getItem('harvest_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const superAdminOnlyTabs = ['utilities', 'layouts'];

            if (superAdminOnlyTabs.includes(tabName) && user.role !== 'super_admin') {
                alert('Access Denied: This feature requires Super Admin privileges.');
                setTab('dashboard'); // Redirect to dashboard
                return;
            }
        } catch (e) {
            console.error("Failed to parse user info", e);
        }
    }

    currentTab = tabName;
    window.location.hash = tabName;

    // Highlight Nav
    document.querySelectorAll('aside nav button').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-700', 'font-bold');
        btn.classList.add('text-gray-600', 'hover:bg-gray-50');
    });
    const activeBtn = document.getElementById(`nav-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600', 'hover:bg-gray-50');
        activeBtn.classList.add('bg-blue-50', 'text-blue-700', 'font-bold');
    }

    // Show View
    // Special handling for shared views (users/customers)
    const targetView = (tabName === 'users') ? 'customers' : tabName;

    document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
    const view = document.getElementById(`view-${targetView}`);
    if (view) view.classList.remove('hidden');
    if (document.getElementById('view-categories') && !document.getElementById('view-categories').classList.contains('hidden')) {
        if (window.loadCategories) window.loadCategories(); // Refetch categories + recalc counts
    }

    // Load Data
    switch (tabName) {
        case 'dashboard': loadDashboard(); break;
        default:
            stopPolling(); // Stop dashboard polling
            break;
    }

    switch (tabName) {
        case 'dashboard': break; // Already loaded
        case 'orders': loadOrders(); break;
        case 'customers': initUsers('customer'); break;
        case 'users': initUsers('admin'); break;
        case 'products': startProductPolling(); break;
        case 'archived': initArchived(); break;
        case 'categories': initCategories(); break;
        case 'inventory':
            startProductPolling(); // Inventory uses products
            break;
        case 'delivery': loadDelivery(); break;
        case 'templates': startProductPolling(); break; // Templates uses products & templates
        case 'settings': initSettings(); break;
        case 'utilities':
            initUtilities();
            break;

        case 'layouts': initLayouts(); break;
        case 'analytics':
            initAnalytics();
            break;
        case 'api-keys':
            initApiKeys();
            break;
    }
}

// Duplicates removed

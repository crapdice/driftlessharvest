import { setLoginHandler } from './api.js';
import { loadDashboard, stopPolling } from './dashboard.js';
import { loadOrders } from './orders.js';
import { loadProducts, loadInventory, loadCategories, loadArchivedProducts, addCategory, saveProduct, openProductModal, openTemplateModal, startProductPolling, stopProductPolling } from './products.js';
import { loadUsers, saveUser, openUserModal } from './users.js';
import { loadDelivery, addDeliveryWindow } from './delivery.js';
import { loadSettings, saveSettings, restoreDefaults } from './settings.js';
import {
    loadLayouts, saveLayout, toggleLayoutItem,
    handleDragStart, handleDragOver, handleDrop,
    openComponentModal, closeComponentModal, setCompTab, saveComponentContent
} from './layouts.js';

// State
let currentTab = 'dashboard';

// Global Exports (Immediate Scope)
window.setTab = setTab;
window.addCategory = addCategory;
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
        } catch (e) {
            console.error("Failed to parse user info", e);
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
    if (modal) modal.classList.remove('hidden');
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
            document.getElementById('login-modal').classList.add('hidden');
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
        case 'customers': loadUsers('customer'); break;
        case 'users': loadUsers('admin'); break;
        case 'products': startProductPolling(); break;
        case 'archived': loadArchivedProducts(); break;
        case 'categories': startProductPolling(); loadCategories(); break; // Categories uses product counts
        case 'inventory':
            startProductPolling(); // Inventory uses products
            break;
        case 'delivery': loadDelivery(); break;
        case 'templates': startProductPolling(); break; // Templates uses products & templates
        case 'settings': loadSettings(); break;
        case 'utilities': break; // No data loading needed

        case 'layouts': loadLayouts(); break;
    }
}

// Duplicates removed

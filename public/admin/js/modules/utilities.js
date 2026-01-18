/**
 * Admin Utilities Module
 * Handles database maintenance, seeding, and diagnostic operations.
 */

import { confirmChoice } from '../components/ChoiceModal.js';
import { api } from './api.js';

// --- Internal State & Constants ---
const VIEW_PATH = 'views/utilities.html';

// --- Core Functions ---

/**
 * Initialize the Utilities View
 * Loads the HTML template and sets up initial statistics.
 */
export async function initUtilities() {
    const container = document.getElementById('view-utilities');
    if (!container) return;

    // Only load if content is empty (or has only the style block)
    if (container.children.length <= 1) {
        try {
            const response = await fetch(VIEW_PATH);
            if (!response.ok) throw new Error('Failed to load utilities view');
            const html = await response.text();

            // Preserve the existing style block if it exists
            const style = container.querySelector('style');
            container.innerHTML = html;
            if (style) container.prepend(style);

            // Re-bind global functions for the newly injected HTML
            bindGlobalActions();
        } catch (error) {
            console.error('Error initializing utilities:', error);
            showToast('Failed to load Utilities interface', 'error');
        }
    }

    // Always refresh stats when entering
    refreshQuickStats();
}

/**
 * Binds module functions to the window object for HTML onclick compatibility.
 * This preserves existing index.html functionality while moving logic to a module.
 */
function bindGlobalActions() {
    window.cleanOrders = cleanOrders;
    window.cleanUsers = cleanUsers;
    window.cleanAnalytics = cleanAnalytics;
    window.cleanDatabase = cleanDatabase;
    window.cleanDeliveryWindows = cleanDeliveryWindows;
    window.seedUsers = seedUsers;
    window.seedOrders = seedOrders;
    window.verifyDatabase = verifyDatabase;
    window.cleanTempFiles = cleanTempFiles;
    window.refreshQuickStats = refreshQuickStats;
    window.viewAllUsers = () => queryTable('users');
    window.viewAllOrders = () => queryTable('orders');
    window.viewAllProducts = () => queryTable('products');
    window.viewDeliveryWindows = () => queryTable('delivery_windows');
    window.viewAddresses = () => queryTable('addresses');
}

// --- Maintenance Operations ---

export async function cleanOrders(event) {
    const confirmed = await confirmChoice({
        title: 'Purge Order Data',
        message: 'This will delete ALL orders, order items, carts, and payment records. This action is irreversible.',
        confirmText: 'Purge Database',
        icon: '🗑️'
    });

    if (!confirmed) return;
    if (event && event.currentTarget) animateToggle(event.currentTarget);

    try {
        const data = await api.cleanOrders();
        showToast('Orders cleaned successfully');
        updateMaintenanceOutput(`
            <div class="space-y-2">
                <p class="text-[11px] text-orange-400 font-bold uppercase tracking-widest leading-none">✅ CLEANUP COMPLETE</p>
                <div class="text-[10px] text-gray-400 font-mono mt-2 space-y-1">
                    <p>• DELETED ORDERS: ${data.deleted.orders}</p>
                    <p>• DELETED ITEMS: ${data.deleted.orderItems}</p>
                    <p>• DELETED CARTS: ${data.deleted.carts}</p>
                </div>
            </div>
        `);
        refreshQuickStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

export async function cleanUsers(event) {
    const confirmed = await confirmChoice({
        title: 'Clear Customer Registry',
        message: 'This will delete ALL customer users and their addresses. Administrator accounts will be preserved.',
        confirmText: 'Clear Users',
        icon: '👥'
    });

    if (!confirmed) return;
    if (event && event.currentTarget) animateToggle(event.currentTarget);

    try {
        const data = await api.cleanUsers();
        showToast('Customer users cleaned successfully');
        updateMaintenanceOutput(`
            <div class="space-y-2">
                <p class="text-[11px] text-orange-400 font-bold uppercase tracking-widest leading-none">✅ REGISTRY FLUSHED</p>
                <div class="text-[10px] text-gray-400 font-mono mt-2 space-y-1">
                    <p>• DELETED CUSTOMERS: ${data.deleted.users}</p>
                    <p>• DELETED ADDRESSES: ${data.deleted.addresses}</p>
                </div>
            </div>
        `);
        refreshQuickStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

export async function cleanAnalytics() {
    const confirmed = await confirmChoice({
        title: 'Purge Analytics Data',
        message: 'This will delete ALL analytics tracking events. This action is irreversible.',
        confirmText: 'Purge Analytics',
        icon: '📊'
    });

    if (!confirmed) return;

    try {
        const data = await api.cleanAnalytics();
        showToast('Analytics data cleaned successfully');
        updateMaintenanceOutput(`
            <div class="space-y-2">
                <p class="text-[11px] text-purple-400 font-bold uppercase tracking-widest leading-none">✅ ANALYTICS PURGED</p>
                <div class="text-[10px] text-gray-400 font-mono mt-2 space-y-1">
                    <p>• DELETED EVENTS: ${data.deleted.analytics_events}</p>
                </div>
            </div>
        `);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

export async function seedUsers() {
    const confirmed = await confirmChoice({
        title: 'Initialize Test Signal',
        message: 'This will create 5 test customer accounts with default addresses.',
        confirmText: 'Spawn Users',
        icon: '👤'
    });

    if (!confirmed) return;

    try {
        const data = await api.seedUsers();
        showToast('Users seeded successfully');
        updateMaintenanceOutput(`
            <div class="space-y-2">
                <p class="text-[11px] text-green-500 font-bold uppercase tracking-widest leading-none">✅ CUSTOMER REGISTRY SEEDED</p>
                <div class="text-[10px] text-gray-400 font-mono mt-2 space-y-1">
                    <p>• USERS CREATED: ${data.created.users}</p>
                    <p>• ADDRESSES: ${data.created.addresses}</p>
                </div>
            </div>
        `);
        refreshQuickStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

export async function cleanDeliveryWindows() {
    const confirmed = await confirmChoice({
        title: 'Purge Delivery Windows',
        message: 'This will delete ALL delivery windows from the database. This action is irreversible.',
        confirmText: 'Purge Windows',
        icon: '🚚'
    });

    if (!confirmed) return;

    try {
        const data = await api.cleanDeliveryWindows();
        showToast('Delivery windows cleaned successfully');
        updateMaintenanceOutput(`
            <div class="space-y-2">
                <p class="text-[11px] text-red-400 font-bold uppercase tracking-widest leading-none">✅ WINDOWS PURGED</p>
                <div class="text-[10px] text-gray-400 font-mono mt-2 space-y-1">
                    <p>• DELETED WINDOWS: ${data.deleted.delivery_windows}</p>
                </div>
            </div>
        `);
        refreshQuickStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

export async function seedOrders() {
    const confirmed = await confirmChoice({
        title: 'Generate Test Traffic',
        message: 'This will create 5 test orders for existing customers.',
        confirmText: 'Spawn Orders',
        icon: '🛒'
    });

    if (!confirmed) return;

    try {
        const data = await api.seedOrders();
        showToast('Orders seeded successfully');
        updateMaintenanceOutput(`
            <div class="text-[11px] text-green-500 font-bold uppercase tracking-widest leading-none">✅ ORDERS SEEDED</div>
            <div class="text-[10px] text-gray-400 font-mono mt-2 space-y-1">
                <p>• ORDERS CREATED: ${data.created.orders}</p>
                <p>• ITEMS CREATED: ${data.created.orderItems}</p>
            </div>
        `);
        refreshQuickStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

export async function refreshQuickStats() {
    try {
        const data = await api.verifyDatabase();
        const count = data.counts;
        // Update all stat elements (Standard and Hi-Fi)
        document.querySelectorAll('.stat-count-users').forEach(el => el.textContent = count.users || 0);
        document.querySelectorAll('.stat-count-orders').forEach(el => el.textContent = count.orders || 0);
        document.querySelectorAll('.stat-count-products').forEach(el => el.textContent = count.products || 0);
    } catch (error) {
        console.error('Failed to refresh stats:', error);
    }
}

export async function verifyDatabase() {
    try {
        const data = await api.verifyDatabase();
        refreshQuickStats();
        const statsEl = document.getElementById('db-diagnostic-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div class="text-sm space-y-2">
                    <p class="text-green-600 font-semibold flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        Database verified successfully
                    </p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p class="text-2xl font-black text-gray-900 dark:text-white">${data.counts.users}</p>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Users</p>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p class="text-2xl font-black text-purple-600">${data.counts.admins}</p>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Admins</p>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p class="text-2xl font-black text-blue-600">${data.counts.orders}</p>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Orders</p>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p class="text-2xl font-black text-emerald-600">${data.counts.products}</p>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Products</p>
                        </div>
                    </div>
                </div>
            `;
        }
        updateMaintenanceOutput(`<p class="text-green-500 font-bold uppercase tracking-widest text-[11px]">✅ DIAGNOSTIC SCAN COMPLETE</p>`);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

export async function cleanDatabase(event) {
    const confirmed = await confirmChoice({
        title: 'Total System Reset',
        message: 'CRITICAL: This will delete EVERYTHING (except your admin account). Orders, Users, Addresses, and Carts will be purged.',
        confirmText: 'Execute Nuke',
        icon: '☢️'
    });

    if (!confirmed) return;
    if (event && event.currentTarget) animateToggle(event.currentTarget);

    try {
        await api.cleanDatabase();
        showToast('Database reset successfully');
        updateMaintenanceOutput(`
            <div class="space-y-2">
                <p class="text-[11px] text-red-500 font-bold uppercase tracking-widest leading-none">☢️ SYSTEM RESET COMPLETE</p>
                <div class="text-[10px] text-gray-400 font-mono mt-2 space-y-1">
                    <p>• ALL CUSTOMER REGISTRY: DELETED</p>
                    <p>• ALL ORDER HISTORY: DELETED</p>
                    <p>• SYSTEM STATE: RESET</p>
                </div>
            </div>
        `);
        refreshQuickStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

export async function cleanTempFiles() {
    const confirmed = await confirmChoice({
        title: 'Maintenance: Clear Temp',
        message: 'Delete cleanup logs and temporary result files?',
        confirmText: 'Clear Files',
        icon: '🧹'
    });

    if (!confirmed) return;

    try {
        await api.cleanTempFiles();
        showToast('Temporary files cleaned');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- Helpers ---

function updateMaintenanceOutput(html) {
    const consoles = ['.hifi-db-output', '#std-db-output'];
    consoles.forEach(selector => {
        const el = selector.startsWith('.') ? document.querySelector(selector) : document.getElementById(selector.substring(1));
        if (el) el.innerHTML = html;
    });
}

function animateToggle(target) {
    if (target && target.classList.contains('hifi-toggle')) {
        target.classList.add('active');
        setTimeout(() => {
            target.classList.remove('active');
        }, 1000);
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast px-6 py-4 rounded-lg shadow-lg text-white ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} mb-3`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function queryTable(tableName) {
    try {
        const data = await api.queryTable(tableName);
        displayQueryResults(tableName, data.results);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function displayQueryResults(tableName, results) {
    const container = document.getElementById('query-results');
    if (!results || results.length === 0) {
        container.innerHTML = `<p class="text-sm text-gray-500">No results found in ${tableName}</p>`;
        return;
    }

    const keys = Object.keys(results[0]);
    container.innerHTML = `
        <div class="mb-3 flex justify-between items-center">
            <h4 class="font-semibold text-gray-800">${tableName.toUpperCase()} (${results.length} rows)</h4>
            <button onclick="document.getElementById('query-results').innerHTML='<p class=\\'text-sm text-gray-500\\'>Click a button above to view database contents</p>'" 
                    class="text-xs text-gray-500 hover:text-gray-700">Clear</button>
        </div>
        <div class="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded">
            <table class="w-full text-xs">
                <thead class="bg-gray-100 sticky top-0">
                    <tr>
                        ${keys.map(key => `<th class="p-2 text-left border-b font-semibold">${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${results.map((row, idx) => `
                        <tr class="hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}">
                            ${keys.map(key => {
        let val = row[key];
        if (typeof val === 'string' && val.length > 50) val = val.substring(0, 50) + '...';
        return `<td class="p-2 border-b text-gray-700">${val !== null && val !== undefined ? val : '-'}</td>`;
    }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

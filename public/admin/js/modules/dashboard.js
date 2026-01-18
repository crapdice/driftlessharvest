import { api } from './api.js';
import { showToast, formatCurrency } from './utils.js';
import { ActiveCarts } from '../components/ActiveCarts.js';


let pollInterval = null;

// Export init function for ViewRouter
export async function init() {
    await loadDashboard();
}

export async function loadDashboard() {
    // Initial Load
    await Promise.all([loadStats(), loadActiveCarts()]);

    // Clear existing interval if any
    if (pollInterval) clearInterval(pollInterval);

    // Start Polling (every 5 seconds)
    pollInterval = setInterval(() => {
        loadActiveCarts();
        loadStats();
    }, 5000);
}

// Cleanup function exposed if needed, though app.js switching just re-calls loadDashboard
export function stopPolling() {
    if (pollInterval) clearInterval(pollInterval);
}

async function loadStats() {
    try {
        const stats = await api.getStats();
        // Animate numbers
        animateValue("stat-revenue", stats.revenue, "$");
        animateValue("stat-orders", stats.orderCount);
        animateValue("stat-pending", stats.pending);
    } catch (e) { console.error('Stats error', e); }
}

// Helper for number animation
function animateValue(id, end, prefix = "") {
    const obj = document.getElementById(id);
    if (!obj) return;
    const start = 0;
    const duration = 1000;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        obj.innerHTML = prefix + (prefix === "$" ? val.toFixed(2) : val);
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = prefix + (prefix === "$" ? end.toFixed(2) : end);
    };
    window.requestAnimationFrame(step);
}

let activeCartsData = [];

async function loadActiveCarts() {
    try {
        const carts = await api.getActiveCarts();
        activeCartsData = carts;
        const container = document.getElementById('active-carts-container');
        if (!container) return;

        // Render using Component
        container.innerHTML = ActiveCarts(carts);

    } catch (e) { console.error('Failed to load active carts', e); }
}

// Global Modal Opener
window.openCartModal = (index) => {
    const cart = activeCartsData[index];
    if (!cart) return;

    document.getElementById('cart-modal-title').innerText = 'Cart Details';
    document.getElementById('cart-modal-subtitle').innerText = cart.email;

    const tbody = document.getElementById('cart-modal-body');
    const totalVal = cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    document.getElementById('cart-modal-total').innerText = formatCurrency(totalVal);

    tbody.innerHTML = cart.items.map(item => `
        <tr class="hover:bg-gray-50 group">
            <td class="py-3 pl-2">
                <div class="flex items-center gap-3">
                    <img src="${item.image_url || 'https://placehold.co/40'}" class="w-8 h-8 rounded object-cover bg-gray-100">
                    <div>
                        <div class="font-medium text-gray-900 line-clamp-1">${item.name}</div>
                        ${item.type === 'box' ? '<div class="text-xs text-purple-600">includes ' + (item.items ? item.items.length : 0) + ' items</div>' : ''}
                    </div>
                </div>
            </td>
            <td class="text-center py-3">
                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.type === 'box' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}">
                    ${item.category || item.type || 'Product'}
                </span>
            </td>
            <td class="text-center py-3 font-mono font-medium text-gray-700">${item.qty}</td>
            <td class="text-right py-3 font-mono text-gray-500">${formatCurrency(item.price)}</td>
            <td class="text-right py-3 pr-2 font-medium text-gray-900">${formatCurrency(item.price * item.qty)}</td>
        </tr>
    `).join('');

    const modal = document.getElementById('cart-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};
